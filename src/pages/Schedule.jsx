import { useMemo } from 'react';
import { CURRENT_SEASON } from '../lib/data.js';
import { computeSeason } from '../lib/stats.js';
import { scheduledSeriesForWeek, TOTAL_WEEKS } from '../lib/constants.js';
import Scorecard from '../components/Scorecard.jsx';
import Pill from '../components/Pill.jsx';

// For each week 1..N, return its 3 series in play order. Uses real data from
// season1.json when present, falls back to the spec rotation otherwise.
function buildFullSchedule(season, computed) {
  const out = [];
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const dataWeek = season.weeks?.find((wk) => wk.week === w);
    if (dataWeek) {
      const seriesList = dataWeek.series.map((s, idx) => {
        const computedSeries = computed.seriesIndex.find(
          (cs) => cs.week === w && cs.matchup_id === s.matchup_id
        );
        return { ...computedSeries, seriesNumber: idx + 1 };
      });
      out.push({ week: w, seriesList });
    } else {
      const sched = scheduledSeriesForWeek(w);
      out.push({ week: w, seriesList: sched });
    }
  }
  return out;
}

function weekStatus(weekEntry) {
  const all = weekEntry.seriesList;
  const upcoming = all.filter((s) => s.status === 'upcoming' || (!s.played && s.status !== 'dnp')).length;
  if (upcoming === 0) return 'complete';
  if (upcoming === all.length) return 'future';
  return 'in-progress';
}

function summarizeWeek(weekEntry) {
  const played = weekEntry.seriesList.filter((s) => s.played).length;
  const dnp = weekEntry.seriesList.filter((s) => s.status === 'dnp').length;
  const upcoming = weekEntry.seriesList.length - played - dnp;
  const parts = [];
  if (played) parts.push(`${played} Played`);
  if (dnp) parts.push(`${dnp} DNP`);
  if (upcoming) parts.push(`${upcoming} Upcoming`);
  return parts.join(' · ');
}

export default function Schedule() {
  const computed = useMemo(() => computeSeason(CURRENT_SEASON), []);
  const schedule = useMemo(() => buildFullSchedule(CURRENT_SEASON, computed), [computed]);

  const allSeries = schedule.flatMap((w) => w.seriesList);
  const totalSeries = allSeries.length;
  const playedCount = allSeries.filter((s) => s.played).length;
  const dnpCount = allSeries.filter((s) => s.status === 'dnp').length;
  const upcomingCount = totalSeries - playedCount - dnpCount;

  // First week with any unplayed-non-DNP series is the "Next Up" anchor.
  const nextUpWeek = schedule.find((w) => weekStatus(w) !== 'complete')?.week;

  function recordFor(key) {
    const d = computed.duoStats[key];
    return `${d.gamesWon}-${d.gamesLost}`;
  }

  return (
    <>
      {/* HERO */}
      <section className="court-bg border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-60 pointer-events-none" />

          <div className="relative">
            <div className="stat-label mb-2">Season {CURRENT_SEASON.season} · 2026</div>
            <h1 className="display font-black text-5xl md:text-6xl leading-[0.95] tracking-wide mb-5">SCHEDULE</h1>

            <div className="flex flex-col gap-2 mb-5">
              <ProgressStat value={totalSeries} label="Series" />
              <ProgressStat value={playedCount} label="Played" cls={playedCount ? 'diff-pos' : ''} />
              <ProgressStat value={dnpCount} label="DNP" cls={dnpCount ? 'text-[var(--amber)]' : ''} />
              <ProgressStat value={upcomingCount} label="Upcoming" />
            </div>

            <div className="flex flex-wrap gap-2">
              {schedule.map((w) => {
                const status = weekStatus(w);
                const isNextUp = w.week === nextUpWeek && status !== 'complete';
                const variant = status === 'complete' ? '' : isNextUp ? 'accent' : '';
                return (
                  <a key={w.week} href={`#week-${w.week}`} className={`pill ${variant}`.trim()}>
                    {status === 'complete' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    Week {w.week}{isNextUp ? ' · Next Up' : ''}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* WEEK SECTIONS */}
      {schedule.map((w, i) => {
        const status = weekStatus(w);
        const isNextUp = w.week === nextUpWeek && status !== 'complete';
        return (
          <div key={w.week}>
            <section id={`week-${w.week}`} className="max-w-6xl mx-auto px-5 pt-12">
              <div className="flex items-end justify-between mb-6 gap-3 flex-wrap">
                <div>
                  <div className="stat-label mb-1">{summarizeWeek(w)}</div>
                  <h2 className="display font-black text-3xl tracking-wide">WEEK {w.week}</h2>
                </div>
                {status === 'complete' && (
                  <Pill variant="success">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Complete
                  </Pill>
                )}
                {isNextUp && <Pill variant="accent">Next Up</Pill>}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {w.seriesList.map((s, idx) => (
                  <div key={s.matchup_id} id={`series-${w.week}-${s.matchup_id}`} className="scroll-mt-20">
                    <Scorecard
                      series={s}
                      weekNumber={w.week}
                      seriesNumber={s.seriesNumber ?? idx + 1}
                      records={
                        !s.played && s.status !== 'dnp'
                          ? { team1: recordFor(s.team1_key), team2: recordFor(s.team2_key) }
                          : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
            {i < schedule.length - 1 && <div className="week-divider my-16" />}
          </div>
        );
      })}

      <div className="pb-12" />
    </>
  );
}

function ProgressStat({ value, label, cls = '' }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`display font-black text-2xl tabular ${cls}`}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
