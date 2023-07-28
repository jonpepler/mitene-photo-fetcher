import { Command } from '@commander-js/extra-typings'
import { monthToDateRange } from './monthToDateRange'

const program = new Command()
  .option(
    '-f, --from <date>',
    'Date start range for photos, inclusive. Must be suplied with to parameter.'
  )
  .option(
    '-t, --to <date>',
    'Date start range for photos, inclusive. Must be suplied with from parameter.'
  )
  .option(
    '-m, --month <month>',
    'Specify the month (1-12) or month name (e.g., January). Alternative to specifying full date range with from and to options.'
  )
  .requiredOption('-a, --albumId <album>', 'Specify the album ID.')
  .option('-p, --password <string≠gp>', 'Specify the album ID.')
  .option(
    '-s, --file-suffix <string>',
    'Provide a string to be included at the end of each media file, after a timestamp.'
  )
  .option('-h, --no-headless', 'Show the Chrome test browser')
  .requiredOption(
    '-d, --directory <string>',
    'Specify a path to download the media files too. e.g. "./images"'
  )
  .option(
    '-q, --quiet',
    'Prevent all logs and instead output a list of all files when complete. When used with --zip, only output the final zip directory.'
  )
  .option(
    '-z, --zip',
    'Zip the folder specified by the directory flag when complete. Delete directory. Use --preserve-directory to prevent deletion.'
  )
  .option(
    '-p, --prevent-deletion',
    'Used with --zip flag. Do not delete provided directory after zipping folder.'
  )

program.parse()

type Options<T = Command> = T extends Command<[], infer R> ? R : never

interface ResolvedOptions {
  from: Date
  to: Date
  albumId: string
  password?: string
  fileSuffix?: string
  headless: boolean
  directory: string
  quiet: boolean
  zip: boolean
  preventDeletion: boolean
}

const getDateRangeValue = (date: string) => new Date(date)

const normaliseRange = ({ from, to }: { from: Date; to: Date }) =>
  from > to ? { from, to } : { from: to, to: from }

// both from and to, or month
const validate = (opts: Options<typeof program>): ResolvedOptions => {
  if (
    (opts.from === undefined || opts.to === undefined) &&
    opts.month === undefined
  )
    throw new Error('Missing required arguments.')
  return {
    ...(opts.from !== undefined && opts.to !== undefined
      ? normaliseRange({
          from: getDateRangeValue(opts.from),
          to: getDateRangeValue(opts.to)
        })
      : monthToDateRange(opts.month as string)),
    albumId: opts.albumId,
    password: opts.password,
    fileSuffix: opts.fileSuffix,
    headless: opts.headless ?? false,
    directory: opts.directory,
    quiet: opts.quiet ?? false,
    zip: opts.zip ?? false,
    preventDeletion: opts.preventDeletion ?? false
  }
}

const preOptions = validate(program.opts())

export const options = {
  ...preOptions,
  from: preOptions.from,
  to: preOptions.to
}
