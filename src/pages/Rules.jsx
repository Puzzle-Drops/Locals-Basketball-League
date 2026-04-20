export default function Rules() {
  return (
    <div className="max-w-none">
      <h1 className="text-2xl font-bold mb-4">League Rules</h1>

      <h2 className="text-lg font-semibold mt-4">Game Format</h2>
      <ul className="list-disc ml-6 text-sm space-y-1">
        <li>2v2 basketball</li>
        <li>Make it take it</li>
        <li>2-pointers and 3-pointers</li>
        <li>First to 21, win by 2</li>
        <li>Each matchup is a best-of-3 series</li>
      </ul>

      <h2 className="text-lg font-semibold mt-4">Season Format</h2>
      <ul className="list-disc ml-6 text-sm space-y-1">
        <li>A season = 3 weeks</li>
        <li>Each week = 3 series (one per matchup)</li>
        <li>Matchup order rotates each week</li>
        <li>"Week" is a logical label, not calendar time</li>
      </ul>

      <h2 className="text-lg font-semibold mt-4">Standings Tiebreakers</h2>
      <ol className="list-decimal ml-6 text-sm space-y-1">
        <li>Head-to-head series record</li>
        <li>Point differential</li>
      </ol>

      <h2 className="text-lg font-semibold mt-4">DNP</h2>
      <p className="text-sm">Any series or game that doesn't get played is logged but awards no points and no wins.</p>

      <h2 className="text-lg font-semibold mt-4">Scoring Model</h2>
      <p className="text-sm">
        Team points are recorded directly. Player points are derived: a player's points scored = team points / 2,
        points allowed = opponent points / 2. Halving keeps a player's stats coherent across all three of their duos.
      </p>
    </div>
  );
}
