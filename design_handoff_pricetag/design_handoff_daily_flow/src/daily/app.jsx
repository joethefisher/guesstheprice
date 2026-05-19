/* global React, ReactDOM */
// src/daily/app.jsx — Design canvas presenting the full daily flow

const { DesignCanvas, DCSection, DCArtboard, DCPostIt } = window;

const W = 1280, H = 820;

function App() {
  return (
    <DesignCanvas>

      <DCSection id="entry" title="01 · Entry point" subtitle="Where the daily lives on the existing home page — the gold-tinted CTA on the right">
        <DCArtboard id="entry-home" label="Home page · Daily CTA" width={W} height={H}>
          <window.DailyEntry/>
        </DCArtboard>
      </DCSection>

      <DCSection id="intro" title="02 · Daily intro" subtitle="The doorway. Two tones — a game-show stage and a quiet 'letter' variant.">
        <DCArtboard id="intro-stage" label="A · Stage (game-show)" width={W} height={H}>
          <window.DailyIntro variant="stage"/>
        </DCArtboard>
        <DCArtboard id="intro-letter" label="B · Letter (quieter)" width={W} height={H}>
          <window.DailyIntro variant="letter"/>
        </DCArtboard>
      </DCSection>

      <DCSection id="play" title="03 · Daily play" subtitle="Same skeleton as Practice mode, but framed as one-shot. No 'skip', explicit warning, gold tint on the badge.">
        <DCArtboard id="play-main" label="Single-guess play screen" width={W} height={H}>
          <window.DailyPlay/>
        </DCArtboard>
      </DCSection>

      <DCSection id="reveal" title="04 · Reveal" subtitle="The dopamine. Two variants — a full theatrical reveal and a more editorial one.">
        <DCArtboard id="reveal-show" label="A · The big reveal (stage)" width={W} height={H}>
          <window.DailyReveal variant="show"/>
        </DCArtboard>
        <DCArtboard id="reveal-quiet" label="B · Editorial reveal" width={W} height={H}>
          <window.DailyReveal variant="quiet"/>
        </DCArtboard>
      </DCSection>

      <DCSection id="share" title="05 · Share card" subtitle="Modal over the reveal. Stylized card + copy-text emoji grid for socials.">
        <DCArtboard id="share-modal" label="Share modal" width={W} height={H}>
          <window.DailyShare/>
        </DCArtboard>
      </DCSection>

      <DCSection id="stats" title="06 · Stats + calendar" subtitle="Wordle-style hero numbers and distribution. 5-week heatmap + trend on the right.">
        <DCArtboard id="stats-main" label="Stats & history" width={W} height={H}>
          <window.DailyStats/>
        </DCArtboard>
      </DCSection>

      <DCSection id="milestone" title="07 · Streak milestone" subtitle="Fires at 7 / 30 / 50 / 100 days. Heavy game-show energy. Confetti, medal, ribbon.">
        <DCArtboard id="milestone-30" label="Day 30 milestone" width={W} height={H}>
          <window.DailyMilestone/>
        </DCArtboard>
      </DCSection>

      <DCSection id="locked" title="08 · Already played" subtitle="The empty state when a user returns mid-day. Countdown to the next house + their result locked behind a veil.">
        <DCArtboard id="locked-main" label="Locked / come back tomorrow" width={W} height={H}>
          <window.DailyLocked/>
        </DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
