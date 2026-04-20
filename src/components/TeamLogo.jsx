import { TEAMS, teamLogo } from '../lib/data.js';
import { TEAM_COLORS, teamGradient } from '../lib/constants.js';

// Round NBA team logo. Falls back to a gradient + initial letter if the
// PNG fails to load. `size` defaults to 40 (matches mockup .logo).
// Use `mini` for the 18px variant used inside game-strip cells.
export default function TeamLogo({ duoKey, size, mini = false, className = '' }) {
  const dim = size ?? (mini ? 18 : 40);
  const colors = TEAM_COLORS[duoKey];
  const wrapperClass = mini ? 'logo-mini' : 'logo';
  const fontSize = mini ? 10 : Math.round(dim * 0.45);

  const style = {
    width: dim,
    height: dim,
    fontSize,
    background: teamGradient(duoKey) ?? undefined,
    color: colors?.fg,
  };

  return (
    <div className={`${wrapperClass} ${className}`.trim()} style={style} aria-label={TEAMS[duoKey]}>
      <img src={teamLogo(duoKey)} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
    </div>
  );
}
