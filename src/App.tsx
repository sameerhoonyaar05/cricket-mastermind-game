import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  CircleDot,
  Clock3,
  RotateCcw,
  Shield,
  Sparkles,
  Trophy,
  Waves,
} from 'lucide-react';
import {
  TEAMS,
  callToss,
  chooseTossDecision,
  continueMatch,
  createMatch,
  playDelivery,
  playShot,
  startMatch,
  type DeliveryChoice,
  type MatchState,
  type ShotChoice,
  type TossCall,
  type TossDecision,
} from '@/lib/game-engine';

type Team = (typeof TEAMS)[number] & { id: string; name: string; shortName?: string };
const shots: { value: ShotChoice; name: string; direction: string; note: string; number: string }[] = [
  { value: 'defend', name: 'Defend', direction: 'Straight bat', note: 'Keep the stumps safe', number: '01' },
  { value: 'drive', name: 'Drive', direction: 'Through the covers', note: 'Find the gap on the ground', number: '02' },
  { value: 'loft', name: 'Loft', direction: 'Over the field', note: 'Go big, take the risk', number: '03' },
  { value: 'sweep', name: 'Sweep', direction: 'Fine leg', note: 'Use the angle and pace', number: '04' },
];
const deliveries: { value: DeliveryChoice; name: string; direction: string; note: string; number: string }[] = [
  { value: 'line', name: 'Outside off', direction: 'Test the edge', note: 'Make them reach for it', number: '01' },
  { value: 'length', name: 'Good length', direction: 'Build pressure', note: 'A reliable starting point', number: '02' },
  { value: 'yorker', name: 'Yorker', direction: 'At the base', note: 'Pin them to the crease', number: '03' },
  { value: 'bouncer', name: 'Bouncer', direction: 'Short and sharp', note: 'Ask a different question', number: '04' },
];

function teamInitials(team?: Team) {
  return (team?.shortName || team?.name || 'XI').split(/\s+/).map((part) => part[0]).join('').slice(0, 3).toUpperCase();
}

function teamName(team?: Team) {
  return team?.name || 'Choose a side';
}

function overNotation(balls: number) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function Button({
  children,
  onClick,
  testId,
  disabled = false,
  secondary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  testId: string;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={`action-button ${secondary ? 'action-secondary' : 'action-primary'}`}
    >
      {children}
    </button>
  );
}

function App() {
  const teams = TEAMS as Team[];
  const [playerTeamId, setPlayerTeamId] = useState(teams[0]?.id ?? '');
  const [opponentTeamId, setOpponentTeamId] = useState(teams[1]?.id ?? '');
  const [overs, setOvers] = useState(5);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [selectedShot, setSelectedShot] = useState<ShotChoice | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryChoice | null>(null);

  const playerTeam = useMemo(() => teams.find((team) => team.id === playerTeamId), [teams, playerTeamId]);
  const opponentTeam = useMemo(() => teams.find((team) => team.id === opponentTeamId), [teams, opponentTeamId]);
  const playerBatting = match?.battingSide === 'player';
  const balls = match
    ? (match.battingSide === 'player' ? match.playerBallsFaced : match.opponentBallsFaced)
    : 0;
  const inningOvers = match?.oversLimit ?? overs;
  const currentOverEvents = match
    ? match.history.filter((event) => {
      const currentOverStart = balls > 0 && balls % 6 === 0 ? balls - 6 : Math.floor(balls / 6) * 6;
      return event.innings === match.innings && event.ball > currentOverStart;
    }).slice(-6)
    : [];
  const canStart = !!playerTeamId && !!opponentTeamId && playerTeamId !== opponentTeamId;

  function freshMatch() {
    setMatch(null);
    setSelectedShot(null);
    setSelectedDelivery(null);
  }

  function startSetup() {
    if (!canStart) return;
    setMatch(createMatch(playerTeamId, opponentTeamId, overs));
  }

  function doToss(call: TossCall) {
    if (match) setMatch(callToss(match, call));
  }

  function doDecision(decision: TossDecision) {
    if (match) setMatch(chooseTossDecision(match, decision));
  }

  function beginPlay() {
    if (match) setMatch(startMatch(match));
  }

  function sendShot() {
    if (match && selectedShot) {
      setMatch(playShot(match, selectedShot));
      setSelectedShot(null);
    }
  }

  function sendDelivery() {
    if (match && selectedDelivery) {
      setMatch(playDelivery(match, selectedDelivery));
      setSelectedDelivery(null);
    }
  }

  function moveOn() {
    if (match) setMatch(continueMatch(match));
  }

  const activeBattingTeam = match ? (playerBatting ? match.playerTeam : match.opponentTeam) as Team : playerTeam;
  const activeBowlingTeam = match ? (playerBatting ? match.opponentTeam : match.playerTeam) as Team : opponentTeam;
  const inningsLabel = match?.innings === 2 ? 'SECOND INNINGS' : 'FIRST INNINGS';

  return (
    <main className="page-shell">
      <header className="masthead">
        <div className="topbar">
          <button className="brand-lockup" type="button" onClick={freshMatch} data-testid="button-home">
            <span className="brand-mark"><Waves size={21} strokeWidth={2.5} /></span>
            <span className="brand-name">CRICKET<span> / </span>MASTERMIND</span>
          </button>
          <div className="topbar-right">
            <span className="edition"><span className="live-dot" /> THE CLUBHOUSE EDITION</span>
            <span className="topbar-rule" />
            <span className="match-format">LIMITED OVERS</span>
          </div>
        </div>
        <div className="masthead-inner">
          <div className="masthead-copy">
            <div className="eyebrow light-eyebrow"><span className="eyebrow-line" /> THINK IT THROUGH. PLAY IT YOUR WAY.</div>
            <h1>One match.<br /><em>Every decision</em> is yours.</h1>
            <p>Pick your side. Call the toss. Then back your instincts, one ball at a time.</p>
          </div>
          <div className="hero-scoreboard" aria-label="Match format">
            <div className="scoreboard-top"><span>YOUR GROUND</span><CircleDot size={16} /></div>
            <div className="scoreboard-graphic">
              <span className="field-ring ring-one" />
              <span className="field-ring ring-two" />
              <span className="field-ring ring-three" />
              <span className="pitch"><i /><i /></span>
              <span className="field-label">THE<br />MIDDLE</span>
            </div>
            <div className="scoreboard-foot"><span>LOCAL MATCH ENGINE</span><span>NO TWO OVERS ALIKE</span></div>
          </div>
          <div className="masthead-stamp">EST.<br /><b>2024</b></div>
        </div>
        <div className="match-ribbon">
          <span><Sparkles size={14} /> PLAY THE MOMENT</span>
          <span>SELECT YOUR XI</span>
          <span>MAKE THE CALL</span>
          <span>OWN THE OUTCOME <ArrowUpRight size={14} /></span>
        </div>
      </header>

      <div className="content-wrap stadium-lines">
        <div className="progress-row" aria-label="Match progress">
          {['01 / SIDES', '02 / TOSS', '03 / MATCH'].map((label, index) => {
            const active = match ? (match.phase === 'setup' ? index === 0 : match.phase === 'toss' || match.phase === 'toss-decision' ? index === 1 : index === 2) : index === 0;
            const done = !!match && ((index === 0 && match.phase !== 'setup') || (index === 1 && !['setup', 'toss'].includes(match.phase)));
            return <div key={label} className={`progress-step ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}><span>{done ? '✓' : label.slice(0, 2)}</span>{label.slice(5)}</div>;
          })}
        </div>

        {!match && (
          <section className="setup-layout entrance">
            <div className="section-intro">
              <div className="eyebrow"><span className="eyebrow-line" /> FIRST, SET THE SCENE</div>
              <h2>Who’s taking<br />the field?</h2>
              <p>Choose your team, pick a challenger, then decide how long you want the story to run.</p>
              <div className="intro-note"><span className="note-mark">01</span><span>Every side has a different feel.<br />The rest is down to you.</span></div>
            </div>
            <div className="setup-panel">
              <div className="setup-heading">
                <div><span className="panel-kicker">MATCH SETUP</span><h3>Build your fixture</h3></div>
                <span className="draft-badge"><span /> READY WHEN YOU ARE</span>
              </div>
              <div className="team-select-grid">
                <label className="field-label-block">
                  <span className="field-title">YOUR TEAM <span>01</span></span>
                  <span className="select-wrap">
                    <select aria-label="Your team" data-testid="select-player-team" value={playerTeamId} onChange={(event) => {
                      setPlayerTeamId(event.target.value);
                      if (event.target.value === opponentTeamId) setOpponentTeamId(teams.find((team) => team.id !== event.target.value)?.id ?? '');
                    }}>
                      {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </select><ChevronDown size={16} />
                  </span>
                  <span className="team-preview"><span className="team-monogram player-monogram">{teamInitials(playerTeam)}</span><span><b>{teamName(playerTeam)}</b><small>YOUR DRESSING ROOM</small></span><Shield size={17} /></span>
                </label>
                <div className="versus-mark">VS</div>
                <label className="field-label-block">
                  <span className="field-title">OPPONENT <span>02</span></span>
                  <span className="select-wrap">
                    <select aria-label="Opponent" data-testid="select-opponent-team" value={opponentTeamId} onChange={(event) => setOpponentTeamId(event.target.value)}>
                      {teams.filter((team) => team.id !== playerTeamId).map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </select><ChevronDown size={16} />
                  </span>
                  <span className="team-preview opponent-preview"><span className="team-monogram opponent-monogram">{teamInitials(opponentTeam)}</span><span><b>{teamName(opponentTeam)}</b><small>THE VISITORS</small></span><Shield size={17} /></span>
                </label>
              </div>
              <div className="overs-row">
                <div className="overs-copy"><span className="field-title">MATCH LENGTH</span><span>How many overs per side?</span></div>
                <div className="overs-select">
                  <select aria-label="Overs per side" data-testid="select-overs" value={overs} onChange={(event) => setOvers(Number(event.target.value))}>
                    {[2, 5, 10].map((value) => <option value={value} key={value}>{value} overs</option>)}
                  </select><ChevronDown size={15} />
                </div>
              </div>
              <div className="setup-bottom">
                <span className="quiet-stat"><Clock3 size={16} /> {overs * 2} overs of cricket</span>
                <Button testId="button-set-fixture" disabled={!canStart} onClick={startSetup}>Set the fixture <ArrowRight size={17} /></Button>
              </div>
            </div>
          </section>
        )}

        {match?.phase === 'toss' && (
          <section className="stage-card toss-card entrance">
            <div className="stage-side-number">02<span> / 03</span></div>
            <div className="stage-main">
              <div className="eyebrow"><span className="eyebrow-line" /> THE COIN IS IN THE AIR</div>
              <h2>Call it.</h2>
              <p className="stage-description">The toss can tilt a match. Pick a side and see where the first decision lands.</p>
              <div className="toss-teams">
                <div className="toss-team"><span className="team-monogram player-monogram">{teamInitials(match.playerTeam as Team)}</span><span>{teamName(match.playerTeam as Team)}</span></div>
                <div className="coin-token">OR</div>
                <div className="toss-team"><span className="team-monogram opponent-monogram">{teamInitials(match.opponentTeam as Team)}</span><span>{teamName(match.opponentTeam as Team)}</span></div>
              </div>
              <div className="choice-grid toss-choices">
                {(['heads', 'tails'] as TossCall[]).map((call) => (
                  <button key={call} type="button" className="choice-card toss-choice" onClick={() => doToss(call)} data-testid={`button-toss-${call}`}>
                    <span className="choice-index">CALL / 0{call === 'heads' ? '1' : '2'}</span><span className="toss-face">{call === 'heads' ? 'H' : 'T'}</span><b>{call === 'heads' ? 'Heads' : 'Tails'}</b><ArrowUpRight size={18} />
                  </button>
                ))}
              </div>
            </div>
            <div className="stage-aside"><div className="coin-illustration"><span>CM</span><i /></div><p>Trust your gut.<br />Then trust your game.</p></div>
          </section>
        )}

        {match?.phase === 'toss-decision' && (
          <section className="stage-card decision-card entrance">
            <div className="stage-side-number">02<span> / 03</span></div>
            <div className="stage-main">
              <div className="eyebrow"><span className="eyebrow-line" /> THE CALL WENT YOUR WAY</div>
              <h2>What’s the plan?</h2>
              <p className="stage-description">You’ve won the toss. Set the tone: put runs on the board, or put the ball in their hands.</p>
              <div className="decision-grid">
                <button type="button" className="decision-option" data-testid="button-decision-bat" onClick={() => doDecision('bat')}>
                  <span className="decision-num">01 — TAKE FIRST STRIKE</span><span className="decision-title">Bat first</span><span className="decision-desc">Make a total they’ll have to chase.</span><span className="decision-arrow"><ArrowRight size={18} /></span>
                </button>
                <button type="button" className="decision-option bowl-option" data-testid="button-decision-bowl" onClick={() => doDecision('bowl')}>
                  <span className="decision-num">02 — PUT THEM IN</span><span className="decision-title">Bowl first</span><span className="decision-desc">Set the target. Then take it down.</span><span className="decision-arrow"><ArrowRight size={18} /></span>
                </button>
              </div>
            </div>
            <div className="stage-aside decision-aside"><span className="decision-quote">“A good toss is a gift.<br /><em>A good call is a skill.</em>”</span><span className="quote-rule" /><small>FROM THE PAVILION</small></div>
          </section>
        )}

        {match?.phase === 'ready' && (
          <section className="ready-card entrance">
            <div className="ready-top"><span className="eyebrow light-eyebrow"><span className="eyebrow-line" /> THE TEAMS ARE SET</span><span className="format-pill">{match.oversLimit} OVERS / SIDE</span></div>
            <div className="ready-matchup">
              <div className="ready-side"><span className={`team-monogram large-monogram ${match.battingSide === 'player' ? 'player-monogram' : 'opponent-monogram'}`}>{teamInitials(activeBattingTeam)}</span><span className="ready-team-name">{teamName(activeBattingTeam)}</span><small>BAT FIRST</small></div>
              <div className="ready-vs"><span>VS</span><i /></div>
              <div className="ready-side"><span className={`team-monogram large-monogram ${match.battingSide === 'player' ? 'opponent-monogram' : 'player-monogram'}`}>{teamInitials(activeBowlingTeam)}</span><span className="ready-team-name">{teamName(activeBowlingTeam)}</span><small>BOWL FIRST</small></div>
            </div>
            <div className="ready-bottom"><span>THE TOSS IS SETTLED. THE MATCH IS YOURS.</span><Button testId="button-start-match" onClick={beginPlay}>Start the match <ArrowRight size={17} /></Button></div>
          </section>
        )}

        {match?.phase === 'playing' && (
          <section className="play-layout entrance">
            <div className="play-main">
              <div className="live-score">
                <div className="live-score-heading"><span className="live-label"><span className="live-dot" /> {inningsLabel} · OVER {overNotation(balls)}</span><span className="format-pill">{match.oversLimit} OVERS</span></div>
                <div className="live-score-body">
                  <div className="batting-team-lockup"><span className={`team-monogram ${playerBatting ? 'player-monogram' : 'opponent-monogram'}`}>{teamInitials(activeBattingTeam)}</span><span><b>{teamName(activeBattingTeam)}</b><small>{playerBatting ? 'YOUR INNINGS' : 'OPPONENT BATTING'}</small></span></div>
                  <div className="score-number" data-testid="status-current-score">{playerBatting ? match.playerRuns : match.opponentRuns}<small> / {playerBatting ? match.playerWickets : match.opponentWickets}</small></div>
                </div>
                <div className="live-score-footer"><span data-testid="status-innings-over">OVER {overNotation(balls)} OF {inningOvers}.0</span><span>{match.target !== null ? `TARGET ${match.target}` : `${Math.max(0, inningOvers * 6 - balls)} BALLS LEFT`}</span></div>
              </div>

              <div className="action-panel">
                <div className="action-panel-heading">
                  <div className="eyebrow"><span className="eyebrow-line" /> {playerBatting ? 'YOUR MOVE · BATTER' : 'YOUR MOVE · BOWLER'}</div>
                  <h2>{playerBatting ? 'Pick your shot.' : 'Set the delivery.'}</h2>
                  <p>{playerBatting ? 'Read the ball. Choose your direction. Then commit.' : 'Choose your line and length. Make every ball count.'}</p>
                </div>
                <div className="choice-grid">
                  {(playerBatting ? shots : deliveries).map((choice) => {
                    const active = playerBatting ? selectedShot === choice.value : selectedDelivery === choice.value;
                    return (
                      <button type="button" key={choice.value} data-testid={`choice-${choice.value}`} aria-pressed={active} className={`choice-card play-choice ${active ? 'selected-choice' : ''}`} onClick={() => playerBatting ? setSelectedShot(choice.value as ShotChoice) : setSelectedDelivery(choice.value as DeliveryChoice)}>
                        <span className="choice-index">{choice.number} <i /></span><b>{choice.name}</b><span className="choice-direction">{choice.direction}</span><small>{choice.note}</small><ArrowUpRight className="choice-arrow" size={17} />
                      </button>
                    );
                  })}
                </div>
                <div className="play-submit-row">
                  <span className="selection-hint">{playerBatting ? selectedShot ? `SHOT SELECTED / ${shots.find((s) => s.value === selectedShot)?.name.toUpperCase()}` : 'SELECT A SHOT TO CONTINUE' : selectedDelivery ? `DELIVERY SET / ${deliveries.find((s) => s.value === selectedDelivery)?.name.toUpperCase()}` : 'SELECT A DELIVERY TO CONTINUE'}</span>
                  <Button testId={playerBatting ? 'button-play-ball' : 'button-bowl-ball'} disabled={playerBatting ? !selectedShot : !selectedDelivery} onClick={playerBatting ? sendShot : sendDelivery}>
                    {playerBatting ? 'Play the ball' : 'Bowl the ball'} <ArrowRight size={17} />
                  </Button>
                </div>
              </div>
            </div>
            <aside className="play-rail">
              <div className="rail-heading"><span className="eyebrow">THE OVER</span><span className="over-count">{overNotation(balls)}<small> OV</small></span></div>
              <div className="ball-track" data-testid="status-current-over">
                {Array.from({ length: 6 }, (_, index) => {
                  const ball = currentOverEvents[index];
                  const isPlayed = !!ball;
                  const result = ball ? (ball.wicket ? 'W' : `${ball.runs}`) : '';
                  return <span key={index} className={`ball-slot ${isPlayed ? 'ball-played' : ''} ${result === 'W' || result.includes('WICKET') ? 'ball-wicket' : ''}`} data-testid={`ball-slot-${index + 1}`}>{isPlayed ? (result || '•') : <i />}</span>;
                })}
              </div>
              <div className="rail-divider" />
              <div className="last-ball">
                <span className="eyebrow">LAST BALL</span>
                <p data-testid="status-last-ball">{match.lastBall?.note || match.message || 'The field is set. Your call.'}</p>
              </div>
              <div className="rail-tip"><span className="tip-symbol">!</span><p>{playerBatting ? 'Pick the right moment to take a risk. A steady innings can still win the day.' : 'Change the question. The best delivery is the one they do not expect.'}</p></div>
              <div className="rail-footer"><span>MADE FOR THE MOMENT</span><span>CM / 01</span></div>
            </aside>
          </section>
        )}

        {(match?.phase === 'innings-break' || match?.phase === 'complete') && (
          <section className="result-layout entrance">
            <div className={`result-banner ${match.phase === 'complete' ? 'final-banner' : ''}`}>
              <div className="result-banner-top"><span className="eyebrow light-eyebrow"><span className="eyebrow-line" /> {match.phase === 'complete' ? 'THAT’S THE MATCH' : 'INNINGS COMPLETE'}</span><span className="format-pill">{match.oversLimit} OVERS / SIDE</span></div>
              <div className="result-banner-content">
                <div><h2>{match.phase === 'complete' ? (match.result || 'A match to remember.') : 'Now, turn it around.'}</h2><p data-testid="status-match-message">{match.message || (match.phase === 'complete' ? 'The final ball has been bowled.' : 'The first innings is in the book. The chase is yours.')}</p></div>
                {match.phase === 'complete' && <div className="trophy-mark"><Trophy size={29} /></div>}
              </div>
                {match.phase === 'innings-break' && <div className="break-callout"><span className="break-target-label">THE CHASE</span><b>{match.target ?? (match.battingSide === 'player' ? match.playerRuns : match.opponentRuns) + 1}</b><span>TO WIN</span></div>}
            </div>
            <div className="scorecard-panel">
              <div className="scorecard-head"><div><span className="eyebrow"><span className="eyebrow-line" /> THE SCORECARD</span><h3>{match.phase === 'complete' ? 'The full story' : 'First innings'}</h3></div><span className="card-meta">{match.oversLimit} OVERS PER INNINGS</span></div>
              <div className="scorecard-row">
                <div className="scorecard-team"><span className="team-monogram player-monogram">{teamInitials(match.playerTeam as Team)}</span><span><b>{teamName(match.playerTeam as Team)}</b><small>{match.phase === 'complete' ? (match.battingSide === 'player' ? 'SECOND INNINGS' : 'FIRST INNINGS') : (match.battingSide === 'player' ? 'FIRST INNINGS' : 'UP NEXT')}</small></span></div>
                  <div className="scorecard-total"><b data-testid="scorecard-player-score">{match.playerRuns}<small>/{match.playerWickets}</small></b><span>{overNotation(match.playerBallsFaced)} overs</span></div>
              </div>
              <div className="scorecard-row">
                <div className="scorecard-team"><span className="team-monogram opponent-monogram">{teamInitials(match.opponentTeam as Team)}</span><span><b>{teamName(match.opponentTeam as Team)}</b><small>{match.phase === 'complete' ? (match.battingSide === 'opponent' ? 'SECOND INNINGS' : 'FIRST INNINGS') : (match.battingSide === 'opponent' ? 'FIRST INNINGS' : 'UP NEXT')}</small></span></div>
                  <div className="scorecard-total"><b data-testid="scorecard-opponent-score">{match.opponentRuns}<small>/{match.opponentWickets}</small></b><span>{match.phase === 'innings-break' && match.innings === 1 ? 'yet to bat' : `${overNotation(match.opponentBallsFaced)} overs`}</span></div>
              </div>
              {match.phase === 'complete' && <div className="result-note"><Trophy size={17} /><span data-testid="status-match-result">{match.result || match.message || 'Match complete'}</span></div>}
              <div className="scorecard-actions">
                {match.phase === 'innings-break' ? <Button testId="button-continue-innings" onClick={moveOn}>Take the field <ArrowRight size={17} /></Button> : <Button testId="button-new-match" onClick={freshMatch}><RotateCcw size={16} /> Play a new match</Button>}
              </div>
            </div>
          </section>
        )}

        {match && match.phase !== 'complete' && (
          <div className="bottom-note"><span><CircleDot size={13} /> LOCAL MATCH / NO ACCOUNT NEEDED</span><span>YOUR CALL. YOUR GAME.</span></div>
        )}
      </div>
      <footer className="site-footer"><span>CRICKET MASTERMIND</span><span>A GAME OF SMALL MOMENTS.</span><span>EST. FOR THE LOVE OF THE GAME</span></footer>
    </main>
  );
}

export default App;
