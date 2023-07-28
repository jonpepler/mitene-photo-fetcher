import cliProgress from 'cli-progress'
import { options } from './command'

export const log = (message: any) => {
  !options.quiet && console.log(message)
}

export const createProgressBar = (total: number) => {
  const bar = !options.quiet
    ? new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
    : { start: () => {}, stop: () => {}, increment: () => {} }

  bar.start(total, 0)

  return { increase: () => bar.increment(), stop: () => bar.stop() }
}
