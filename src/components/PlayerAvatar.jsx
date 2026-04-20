import { playerPortrait } from '../lib/data.js';
import { playerGradient } from '../lib/constants.js';

// Round player avatar. Falls back to a gradient + initial letter if the
// PNG fails to load. Defaults to 40px. `lg` = 72px, `xl` = 128px.
export default function PlayerAvatar({ name, size, lg = false, xl = false, className = '' }) {
  const dim = size ?? (xl ? 128 : lg ? 72 : 40);
  const fontSize = xl ? 56 : lg ? 28 : Math.round(dim * 0.4);
  const variantClass = xl ? 'avatar-xl' : lg ? 'avatar-lg' : '';

  const style = {
    width: dim,
    height: dim,
    fontSize,
    background: playerGradient(name) ?? undefined,
  };

  return (
    <div className={`avatar ${variantClass} ${className}`.trim()} style={style} aria-label={name}>
      <img src={playerPortrait(name)} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
    </div>
  );
}
