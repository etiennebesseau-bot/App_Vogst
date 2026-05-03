import { LevelInfo } from '../types'

interface Props {
  levelInfo: LevelInfo
  small?: boolean
}

export default function LevelBadge({ levelInfo, small = false }: Props) {
  if (small) {
    return (
      <span className="text-xs text-white/80">
        {levelInfo.emoji} {levelInfo.name}
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: levelInfo.color }}
    >
      {levelInfo.emoji} {levelInfo.name}
    </span>
  )
}
