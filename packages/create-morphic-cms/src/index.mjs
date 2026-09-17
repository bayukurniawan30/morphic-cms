import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const REPOSITORY_URL =
  'https://github.com/bayukurniawan30/morphic-cms.git'
export const DEFAULT_REF = 'v1.4.1'

const HELP = `
Create a self-hosted Morphic CMS project.

Usage:
  npx create-morphic-cms@latest <project-directory> [options]

Options:
  --ref <ref>                 CMS branch, tag, or commit to scaffold (default: v1.4.1)
  --database-url <url>        PostgreSQL connection string
  --admin-email <email>       Initial super-admin email
  --admin-password <password> Initial super-admin password
  --admin-username <username> Initial super-admin username
  --app-domain <domain>       Optional production base domain
  --skip-install              Do not run pnpm install
  --skip-db                   Do not run migrations or seed the database
  --yes                       Accept defaults and do not prompt
  -h, --help                  Show this help message
`

export function parseArgs(argv) {
  const options = {
    directory: null,
    ref: DEFAULT_REF,
    databaseUrl: '',
    adminEmail: '',
    adminPassword: '',
    adminUsername: '',
    appDomain: '',
    skipInstall: false,
    skipDb: false,
    yes: false,
    help: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '-h' || argument === '--help') {
      options.help = true
      continue
    }
    if (argument === '--skip-install') {
      options.skipInstall = true
      continue
    }
    if (argument === '--skip-db') {
      options.skipDb = true
      continue
    }
    if (argument === '--yes') {
      options.yes = true
      continue
    }

    const key = {
      '--ref': 'ref',
      '--database-url': 'databaseUrl',
      '--admin-email': 'adminEmail',
      '--admin-password': 'adminPassword',
      '--admin-username': 'adminUsername',
      '--app-domain': 'appDomain',
    }[argument]

    if (key) {
      const value = argv[index + 1]
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a value`)
      }
      options[key] = value
      index += 1
      continue
    }

    if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`)
    }
    if (options.directory) {
      throw new Error('Only one project directory can be provided')
    }
    options.directory = argument
  }

  return options
}

export function setEnvValue(contents, key, value) {
  const expression = new RegExp(`^${key}=.*$`, 'm')
  const line = `${key}=${value}`
  return expression.test(contents)
    ? contents.replace(expression, line)
    : `${contents.trimEnd()}\n${line}\n`
}

export function buildEnvironment(contents, options) {
  let environment = contents
  environment = setEnvValue(
    environment,
    'JWT_SECRET',
    randomBytes(32).toString('base64url')
  )
  environment = setEnvValue(environment, 'JWT_EXPIRES_IN_DAYS', '7')
  environment = setEnvValue(environment, 'IS_SELF_HOSTED', 'true')

  if (options.databaseUrl) {
    environment = setEnvValue(environment, 'DATABASE_URL', options.databaseUrl)
  }
  if (options.appDomain) {
    environment = setEnvValue(environment, 'APP_DOMAIN', options.appDomain)
  }
  if (options.adminEmail) {
    environment = setEnvValue(environment, 'SEED_ADMIN_EMAIL', options.adminEmail)
  }
  if (options.adminPassword) {
    environment = setEnvValue(
      environment,
      'SEED_ADMIN_PASSWORD',
      options.adminPassword
    )
  }
  if (options.adminUsername) {
    environment = setEnvValue(
      environment,
      'SEED_ADMIN_USERNAME',
      options.adminUsername
    )
  }

  return environment
}

async function command(commandName, args, options = {}) {
  await new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(commandName, args, {
      cwd: options.cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.on('error', (error) => {
      rejectCommand(
        new Error(`Could not run ${commandName}. Make sure it is installed. (${error.message})`)
      )
    })
    child.on('exit', (code) => {
      if (code === 0) resolveCommand()
      else rejectCommand(new Error(`${commandName} exited with code ${code}`))
    })
  })
}

async function promptForMissingOptions(options) {
  if (options.yes || !process.stdin.isTTY) return options

  const input = createInterface({ input: process.stdin, output: process.stdout })
  try {
    if (!options.databaseUrl) {
      options.databaseUrl = await input.question(
        'PostgreSQL DATABASE_URL (leave blank to configure later): '
      )
    }
    if (options.databaseUrl && !options.adminEmail) {
      options.adminEmail = await input.question(
        'Initial admin email [admin@morphic.cms]: '
      )
      options.adminEmail ||= 'admin@morphic.cms'
    }
    if (options.databaseUrl && !options.adminUsername) {
      options.adminUsername = await input.question(
        'Initial admin username [superadmin]: '
      )
      options.adminUsername ||= 'superadmin'
    }
    if (options.databaseUrl && !options.adminPassword) {
      options.adminPassword = await input.question(
        'Initial admin password (leave blank to generate one): '
      )
    }
    if (!options.appDomain) {
      options.appDomain = await input.question(
        'Production app domain (optional): '
      )
    }
  } finally {
    input.close()
  }

  return options
}

async function assertTargetDirectory(targetDirectory) {
  if (!existsSync(targetDirectory)) return
  const files = await readdir(targetDirectory)
  if (files.length > 0) {
    throw new Error(`Target directory is not empty: ${targetDirectory}`)
  }
}

async function cloneStarter(targetDirectory, ref) {
  const temporaryDirectory = await mkdtemp(`${tmpdir()}/create-morphic-cms-`)
  try {
    await command('git', [
      'clone',
      '--depth',
      '1',
      '--branch',
      ref,
      REPOSITORY_URL,
      temporaryDirectory,
    ])
    await rm(`${temporaryDirectory}/.git`, { recursive: true, force: true })
    await cp(temporaryDirectory, targetDirectory, { recursive: true })
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}

async function configureProject(targetDirectory, options) {
  const environmentExamplePath = `${targetDirectory}/.env.example`
  const environmentPath = `${targetDirectory}/.env`
  const example = await readFile(environmentExamplePath, 'utf8')
  const environment = buildEnvironment(example, options)
  await writeFile(environmentPath, environment, { encoding: 'utf8', mode: 0o600 })
}

export async function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  if (options.help) {
    console.log(HELP)
    return
  }
  if (!options.directory) {
    throw new Error(`A project directory is required.\n${HELP}`)
  }

  await promptForMissingOptions(options)
  if (options.databaseUrl && !options.adminPassword) {
    options.adminPassword = randomBytes(18).toString('base64url')
    console.log(`\nGenerated initial admin password: ${options.adminPassword}`)
  }

  const targetDirectory = resolve(process.cwd(), options.directory)
  if (targetDirectory === process.cwd()) {
    throw new Error('Choose a new project directory instead of the current directory')
  }
  await assertTargetDirectory(targetDirectory)

  console.log(`\nCreating Morphic CMS in ${targetDirectory}...`)
  await cloneStarter(targetDirectory, options.ref)
  await configureProject(targetDirectory, options)

  if (!options.skipInstall) {
    console.log('\nInstalling dependencies...')
    await command('pnpm', ['install'], { cwd: targetDirectory })
  }

  if (!options.skipDb && options.databaseUrl) {
    console.log('\nApplying database migrations...')
    await command('pnpm', ['db:migrate'], { cwd: targetDirectory })
    console.log('\nCreating the initial workspace and admin...')
    await command('pnpm', ['db:seed'], { cwd: targetDirectory })
  } else if (!options.skipDb) {
    console.log('\nDatabase setup skipped because no DATABASE_URL was provided.')
  }

  console.log(`\n✓ Morphic CMS is ready in ${basename(targetDirectory)}\n`)
  console.log('Next steps:')
  console.log(`  cd ${options.directory}`)
  if (!options.databaseUrl) {
    console.log('  Update DATABASE_URL and admin seed settings in .env')
    console.log('  pnpm db:migrate && pnpm db:seed')
  }
  console.log('  pnpm dev')
}

const isDirectExecution =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  run().catch((error) => {
    console.error(`\n✖ ${error.message}`)
    process.exitCode = 1
  })
}
