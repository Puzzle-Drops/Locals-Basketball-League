import { CURRENT_SEASON, TEAMS } from '../lib/data.js';
import { duoKeysFor, pairingsFor, playersFor, splitKey } from '../lib/constants.js';
import TeamLogo from '../components/TeamLogo.jsx';
import Pill from '../components/Pill.jsx';

// The rules page describes the league as it stands now, so everything below is
// derived from the current season's roster.
const DUO_KEYS = duoKeysFor(CURRENT_SEASON);
const ROSTER = playersFor(CURRENT_SEASON);

// Three legal pairings (a duo can't play another duo that shares a player).
const LETTERS = ['A', 'B', 'C'];
const PAIRINGS = Object.entries(pairingsFor(CURRENT_SEASON)).map(
  ([id, [team1, team2]], i) => ({ letter: LETTERS[i], matchupId: Number(id), team1, team2 })
);

export default function Rules() {
  return (
    <>
      {/* HERO */}
      <section className="court-bg border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-60 pointer-events-none" />
          <div className="relative">
            <div className="stat-label mb-2">Official Rulebook</div>
            <h1 className="display font-black text-5xl md:text-6xl leading-[0.95] tracking-wide mb-4">RULES</h1>
            <p className="text-[var(--text-muted)] text-base md:text-lg max-w-xl">
              How the Locals Basketball League works, from a single possession to the full season.
            </p>

            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-dim)] font-semibold mt-4">
              Season {CURRENT_SEASON.season} roster · {ROSTER.join(' · ')}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <HeroStat value={ROSTER.length} label="Players" />
              <HeroStat value={DUO_KEYS.length} label="Teams" />
              <HeroStat value={9} label="Series / Season" />
              <HeroStat value={27} label="Games / Season" />
            </div>
          </div>
        </div>
      </section>

      {/* 01: HOW A GAME IS PLAYED */}
      <Section number="01" title="HOW A GAME IS PLAYED">
        <div className="flex flex-wrap gap-2 mb-5">
          <Pill variant="accent">Make It Take It</Pill>
          <Pill>2s and 3s</Pill>
          <Pill>First to 21</Pill>
          <Pill>Loser's Ball</Pill>
        </div>
        <div className="prose-body max-w-2xl">
          <p>
            <strong>Make it, take it:</strong> the scoring team keeps possession. A stop is the only way to get the ball back.
          </p>
          <p>
            Shots inside the arc are <strong>2 points</strong>, beyond the arc are <strong>3 points</strong>. First team to <strong>21</strong> wins the game. Play straight up, no win by 2.
          </p>
          <p>
            <strong>First possession:</strong> on Game 1, the team currently lower in the standings starts with the ball. On Games 2 and 3, the team that <strong>lost the previous game</strong> gets the ball to start.
          </p>
        </div>
      </Section>

      {/* 02: SERIES & SEASON */}
      <Section number="02" title="SERIES & SEASON">
        <div className="prose-body max-w-2xl mb-6">
          <p>
            Every matchup is a <strong>3-game series</strong>. All three games are always played. A team up 2-0 still plays G3. The series is won by whichever duo takes <strong>2 or more</strong> of the 3 games, but every game counts toward points, differential, and the games-won record.
          </p>
          <p>
            A regular season runs <strong>3 weeks</strong>. Each week all 3 pairings play once, so every duo is in action every week. That's <strong>9 series</strong> per season, for <strong>27 games</strong> in a complete season.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-xl">
          <NumberCard value={3} label="Weeks" />
          <NumberCard value={9} label="Series" />
          <NumberCard value={27} label="Games" />
        </div>
      </Section>

      {/* 03: THE SIX DUOS */}
      <Section number="03" title="THE SIX DUOS">
        <div className="prose-body max-w-2xl mb-6">
          <p>
            Four players, six possible partnerships <span className="text-[var(--text-dim)]">(4 choose 2)</span>. Each duo carries its own NBA team name. Names stay with a partnership for as long as that partnership exists; when the roster changes, the new duos get new franchises.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DUO_KEYS.map((key) => (
            <div key={key} className="card p-4 flex items-center gap-3">
              <TeamLogo duoKey={key} size={44} />
              <div className="min-w-0">
                <div className="display font-black text-base leading-none">{TEAMS[key]?.toUpperCase()}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">{splitKey(key).join(' & ')}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 04: THE THREE PAIRINGS */}
      <Section number="04" title="THE THREE PAIRINGS">
        <div className="prose-body max-w-2xl mb-6">
          <p>
            A duo can't play a duo that shares one of its players, which means each duo has exactly one legal opponent. That produces <strong>3 fixed pairings</strong> (A, B, and C), and every week all three play a 3-game series.
          </p>
          <p>
            Every player ends up on the floor in every pairing, just in different partnerships. Across a week, all 4 players play 3 series.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PAIRINGS.map((p) => (
            <PairingCard key={p.letter} pairing={p} />
          ))}
        </div>
      </Section>

      {/* 05: STANDINGS & STATS */}
      <Section number="05" title="STANDINGS & STATS">
        <div className="prose-body max-w-2xl mb-6">
          <p>
            Standings rank by <strong>games won</strong>. When two duos are tied, the first tiebreaker is <strong>head-to-head series record</strong>. If still level, <strong>point differential</strong> decides. The <strong>top 4</strong> teams advance to the playoffs.
          </p>
          <p>
            The W/L display can toggle between <strong>games</strong> (every game counts individually) and <strong>series</strong> (series-level W/L), but the ranking itself is always based on game wins.
          </p>
          <p>
            Every stat is tracked at the team level. A team's point differential is its total points scored minus points allowed. <strong>Player-level points</strong> are computed as the team's points divided by two. Both teammates contribute to every bucket, so within a single game their individual lines mirror each other.
          </p>
          <p>
            If a series can't be played at all, it's recorded as <strong>DNP</strong>. No wins, no losses, no points awarded for either side. If a series is identical on every quantitative criterion (rare, but possible), seeding falls back to a <strong>coinflip</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="card p-5">
            <div className="stat-label mb-3">Columns Tracked</div>
            <div className="flex flex-wrap gap-2">
              <Pill variant="small">W / L</Pill>
              <Pill variant="small">PF</Pill>
              <Pill variant="small">PPG / PPS</Pill>
              <Pill variant="small">PA</Pill>
              <Pill variant="small">PAPG / PAPS</Pill>
              <Pill variant="small">+/-</Pill>
              <Pill variant="small">AVG/G, AVG/S</Pill>
              <Pill variant="small">Win%</Pill>
            </div>
          </div>

          <div className="card p-5">
            <div className="stat-label mb-3">Ranking Logic</div>
            <ol className="text-[14px] text-[var(--text-muted)] leading-relaxed space-y-1.5">
              <RankItem n="1." text="Game wins (primary)" />
              <RankItem n="2." text="Head-to-head series record" />
              <RankItem n="3." text="Point differential" />
              <RankItem n="4." text="Coinflip (final fallback)" />
            </ol>
          </div>
        </div>
      </Section>

      {/* 06: PLAYOFFS */}
      <Section number="06" title="PLAYOFFS">
        <div className="prose-body max-w-2xl mb-6">
          <p>
            The <strong>top 4 teams</strong> from the regular-season standings advance to the playoffs. Because standings rank by game wins, seeding is simple: the team with the most wins earns the <strong>#1</strong> seed, down to <strong>#4</strong>. Inside the bracket, <strong>#1 vs #4</strong> on the left side, <strong>#2 vs #3</strong> on the right. The two winners meet in the <strong>championship</strong>.
          </p>
          <p>
            Once in the bracket, matchups aren't played live. They're decided by comparing the two teams' regular-season <strong>point differential (+/-)</strong>. The team with the higher +/- advances. A result might look like Lakers +19 vs Bucks -19, sending Lakers through. If both teams have identical +/-, the matchup falls back to a <strong>coinflip</strong>.
          </p>
          <p>
            <strong>Game wins get you in, +/- wins you games inside.</strong> Two metrics, two stages. Game wins decide who makes the playoffs because that's how teams are ranked over a season; +/- decides matchups inside the bracket because cross-pairing matchups may feature teams that never played each other, leaving no head-to-head W/L.
          </p>
          <p>
            Because +/- comes from games already played, playoff results <strong>don't add anything</strong> to team or player stat totals. No double counting.
          </p>
          <p>
            The bracket is visible throughout the regular season as a live <strong>projection</strong>. It shows what would happen if the season ended today, and updates as games are played. When the final regular-season series wraps, the bracket locks and the champion is declared.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <BracketCard label="Left Bracket" top="#1 SEED" bottom="#4 SEED" />
          <BracketCard label="Championship" top="WINNER LEFT" bottom="WINNER RIGHT" accent />
          <BracketCard label="Right Bracket" top="#2 SEED" bottom="#3 SEED" />
        </div>
      </Section>

      <div className="pb-16" />
    </>
  );
}

function HeroStat({ value, label }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="display font-black text-2xl tabular w-8 text-right">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function Section({ number, title, children }) {
  return (
    <section className="max-w-6xl mx-auto px-5 pt-14 md:pt-16">
      <div className="section-block">
        <div className="section-num">{number}</div>
        <div>
          <h2 className="section-title">{title}</h2>
          {children}
        </div>
      </div>
    </section>
  );
}

function NumberCard({ value, label }) {
  return (
    <div className="card p-4">
      <div className="display font-black text-3xl md:text-4xl leading-none tabular">{value}</div>
      <div className="stat-label mt-2">{label}</div>
    </div>
  );
}

function PairingCard({ pairing }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <Pill variant="small accent">Pairing {pairing.letter}</Pill>
        <span className="text-[10px] text-[var(--text-dim)] font-bold tracking-[0.12em] uppercase">3 Games</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <PairingSide duoKey={pairing.team1} />
        <div className="display font-black text-sm text-[var(--text-dim)] tracking-[0.16em]">VS</div>
        <PairingSide duoKey={pairing.team2} />
      </div>
    </div>
  );
}

function PairingSide({ duoKey }) {
  const [a, b] = splitKey(duoKey);
  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <TeamLogo duoKey={duoKey} size={44} />
      <div className="display font-black text-base leading-none">{TEAMS[duoKey]?.toUpperCase()}</div>
      <div className="text-[10px] text-[var(--text-muted)] text-center leading-tight">
        {a}<br />{b}
      </div>
    </div>
  );
}

function RankItem({ n, text }) {
  return (
    <li>
      <span className="display font-black text-[var(--accent)] mr-2">{n}</span>{text}
    </li>
  );
}

function BracketCard({ label, top, bottom, accent = false }) {
  const style = accent
    ? { borderColor: 'var(--accent-ring)', background: 'linear-gradient(180deg, var(--accent-soft), transparent)' }
    : {};
  return (
    <div className="card p-5 bracket-card" style={style}>
      <Pill variant={accent ? 'small accent' : 'small'}>{label}</Pill>
      <div className="mt-4">
        <div className="bracket-seed">{top}</div>
        <span className="bracket-vs">VS</span>
        <div className="bracket-seed">{bottom}</div>
      </div>
    </div>
  );
}
