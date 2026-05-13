import {
  AbsoluteFill, Audio, Video, Series, Sequence,
  useVideoConfig, interpolate, useCurrentFrame, spring, random
} from 'remotion';
import React from 'react';
import { loadFont } from "@remotion/google-fonts/BebasNeue";

const { fontFamily } = loadFont();

// ── AUDIO VOLUME CONSTANTS ────────────────────────────────────────────────────
// Voiceover at 1.0 is DOMINANT. SFX accent the edit — felt, not heard over VO.
const SFX_VOL_HOOK = 0.18;
const SFX_VOL_CTA  = 0.18;
const SFX_VOL_MID  = 0.13;
// ─────────────────────────────────────────────────────────────────────────────

interface Segment {
  start: number;
  end: number;
  text: string;
  text_effect?: 'pop' | 'glitch' | 'typewriter';
  position?: 'top' | 'center' | 'bottom';
  highlight_word?: string;
}

interface EditorEffects {
  zoom: boolean;
  transition: 'fade' | 'flash' | 'none';
  textStyle: string;
}

// ── Progress bar (gold, 6px, top of frame) ───────────────────────────────────
const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ height: '6px', top: 0, backgroundColor: 'rgba(255,215,0,0.20)' }}>
      <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #FFD700, #FFA500)' }} />
    </AbsoluteFill>
  );
};

// ── Vignette (darkens edges, keeps text readable) ────────────────────────────
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)',
      pointerEvents: 'none',
      zIndex: 2,
    }}
  />
);

// ── CRT Scanline Overlay — GAMING ONLY ───────────────────────────────────────
const CRTOverlay: React.FC = () => (
  <AbsoluteFill
    style={{
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.10) 2px, rgba(0,0,0,0.10) 4px)',
      pointerEvents: 'none',
      zIndex: 3,
    }}
  />
);

// ── HOOK OVERLAY — Category-Aware ────────────────────────────────────────────
// Gaming:   Retro "CLASSIFIED" stamp (kept — matches aesthetic)
// General:  Animated data/stats bar (cinematic, modern)
// US:       Breaking news flash (relatable American format)
const HookOverlay: React.FC<{ fps: number; category: string }> = ({ fps, category }) => {
  const frame = useCurrentFrame();
  if (frame > 2.5 * fps) return null;

  const opacity = interpolate(frame, [0, 6, 2.4 * fps, 2.5 * fps], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (category === 'gaming') {
    // Flashing CLASSIFIED stamp — fits retro gaming aesthetic
    const isVisible = frame % 15 < 10;
    return isVisible ? (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', pointerEvents: 'none', zIndex: 4, top: '-25%' }}>
        <div style={{
          border: '8px solid rgba(255, 30, 30, 0.85)',
          color: 'rgba(255, 30, 30, 0.85)',
          fontSize: '100px',
          fontWeight: '900',
          fontFamily,
          padding: '16px 36px',
          transform: 'rotate(-8deg)',
          opacity,
          textShadow: '0px 0px 15px rgba(255,0,0,0.5)',
          boxShadow: '0 0 20px rgba(255,0,0,0.35) inset, 0 0 20px rgba(255,0,0,0.35)'
        }}>
          CLASSIFIED
        </div>
      </AbsoluteFill>
    ) : null;
  }

  if (category === 'us-centric') {
    // Breaking News ticker flash — relatable to US audience
    return (
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-start', pointerEvents: 'none', zIndex: 4, flexDirection: 'column', padding: '0 0 120px 0' }}>
        <div style={{
          backgroundColor: '#CC0000',
          color: '#FFFFFF',
          fontFamily,
          fontSize: '38px',
          fontWeight: '900',
          letterSpacing: '3px',
          padding: '10px 30px',
          opacity,
          textTransform: 'uppercase',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}>
          BREAKING NEWS
        </div>
        <div style={{
          backgroundColor: '#1a1a1a',
          color: '#FFD700',
          fontFamily,
          fontSize: '28px',
          padding: '8px 30px',
          opacity: opacity * 0.9,
          width: '100%',
          textAlign: 'center',
        }}>
          — THIS ACTUALLY HAPPENED —
        </div>
      </AbsoluteFill>
    );
  }

  // General / Science / History — animated data/fact badge
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', pointerEvents: 'none', zIndex: 4, paddingTop: '80px' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(20,20,40,0.90) 100%)',
        border: '2px solid #FFD700',
        borderRadius: '8px',
        color: '#FFD700',
        fontFamily,
        fontSize: '32px',
        fontWeight: '900',
        letterSpacing: '4px',
        padding: '12px 36px',
        opacity,
        textTransform: 'uppercase',
        boxShadow: '0 0 20px rgba(255,215,0,0.3)',
      }}>
        ◈ VERIFIED FACT ◈
      </div>
    </AbsoluteFill>
  );
};

// ── Background video clip ─────────────────────────────────────────────────────
const ZoomingVideo: React.FC<{
  url: string;
  effects: EditorEffects;
  clipDuration: number;
  renderSeed: number;
}> = ({ url, effects, clipDuration, renderSeed }) => {
  const frame = useCurrentFrame();
  
  // PRO MOVE: Randomized Ken Burns Direction (In vs Out) based on renderSeed + URL
  const zoomDirection = random(url + renderSeed) > 0.5 ? 1 : -1;
  const startScale = zoomDirection === 1 ? 1.0 : 1.15;
  const endScale = zoomDirection === 1 ? 1.15 : 1.0;
  
  const scale = effects?.zoom 
    ? interpolate(frame, [0, clipDuration], [startScale, endScale], { extrapolateRight: 'clamp' }) 
    : 1.05;

  // Cinematic Drift: Slow horizontal movement
  const driftDirection = random(url + "drift" + renderSeed) > 0.5 ? 1 : -1;
  const driftX = interpolate(frame, [0, clipDuration], [0, 25 * driftDirection]);

  const shakeX = frame < 8 && random(url + renderSeed) > 0.5 ? Math.sin(frame * 2) * 6 : 0;

  const opacity =
    effects?.transition === 'fade'
      ? interpolate(
          frame,
          [0, 10, clipDuration - 10, clipDuration],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        )
      : 1;

  const flashOpacity =
    effects?.transition === 'flash'
      ? interpolate(frame, [0, 4], [0.6, 0], { extrapolateRight: 'clamp' })
      : 0;

  return (
    <AbsoluteFill style={{ transform: `scale(${scale}) translateX(${shakeX + driftX}px)`, opacity }}>
      {/* Background Dimmer — PRO MOVE: Ensures text readability without a harsh black box */}
      <AbsoluteFill style={{ backgroundColor: 'black', opacity: 0.15, zIndex: 1 }} />
      <Video
        src={url}
        muted
        loop
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <AbsoluteFill style={{ backgroundColor: 'white', opacity: flashOpacity, zIndex: 5 }} />
    </AbsoluteFill>
  );
};

// ── Caption text with dynamic sizing + highlight word ────────────────────────
// IMPROVED: Highlight word now renders GOLD (#FFD700) instead of red for
// better readability on mobile and a more premium brand look.
const AnimatedText: React.FC<{ segment: Segment; effects: EditorEffects }> = ({
  segment,
}) => {
  const frame = useCurrentFrame();
  const pop = spring({ frame, fps: 30, config: { damping: 12, stiffness: 200 } });

  const isGlitching = segment.text_effect === 'glitch' && frame % 12 > 9;
  const glitchX = isGlitching ? random(frame) * 12 - 6 : 0;

  // Fact-reveal shake: a subtle horizontal shake on glitch segments at frame 0-8
  const factShakeX = segment.text_effect === 'glitch'
    ? interpolate(frame, [0, 4, 8, 12], [6, -6, 3, 0], { extrapolateRight: 'clamp' })
    : 0;

  // Typewriter effect: reveal characters over 30 frames
  const chars = segment.text.length;
  const revealed = Math.floor(interpolate(frame, [0, 30], [0, chars], { extrapolateRight: 'clamp' }));
  const displayText = segment.text_effect === 'typewriter' ? segment.text.slice(0, revealed) : segment.text;
  const cursor = segment.text_effect === 'typewriter' && frame % 15 < 7 ? '_' : '';

  // Dynamic font size — prevents overflow on long captions
  const words = displayText.split(' ').filter(w => w.length > 0);
  const wordCount = words.length;
  const maxCharInWord = words.length > 0 ? Math.max(...words.map(w => w.length)) : 1;
  const dynamicSize = maxCharInWord > 12 ? 80 : maxCharInWord > 9 ? 95 : wordCount > 2 ? 105 : 125;

  const yPos = segment.position === 'top' ? '10%' : segment.position === 'bottom' ? '72%' : '48%';

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 50px',
        top: yPos,
        // PRO MOVE: Safety Bounding Box
        // Ensures center text never 'bleeds' into the karaoke zone at the bottom
        maxHeight: '25%', 
        height: 'auto',
        transform: `translateX(${factShakeX}px)`,
        overflow: 'hidden', // Final safety: crop instead of overlap
      }}
    >
      <h1
        style={{
          fontSize: `${dynamicSize}px`,
          textAlign: 'center',
          fontWeight: '900',
          fontFamily,
          textTransform: 'uppercase',
          WebkitTextStroke: '3px #000',
          textShadow: isGlitching
            ? '4px 0px 0px #0ff, -4px 0px 0px #f0f'
            : '0px 8px 28px rgba(0,0,0,0.98)',
          transform: segment.text_effect === 'pop'
            ? `scale(${pop})`
            : `translateX(${glitchX}px)`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '16px',
          lineHeight: 1.05,
        }}
      >
        {displayText.split(' ').map((word, i) => (
          <span
            key={i}
            style={{
              // GOLD highlight word — more premium and readable on mobile than red
              color: word.toUpperCase() === segment.highlight_word?.toUpperCase()
                ? '#FFD700'
                : '#FFFFFF',
            }}
          >
            {word}
          </span>
        ))}
        {cursor && <span style={{ color: '#FFD700' }}>{cursor}</span>}
      </h1>
    </AbsoluteFill>
  );
};

// ── Context-aware SFX picker ──────────────────────────────────────────────────
function pickSfx(
  sfxUrls: string[],
  segmentIndex: number,
  totalSegments: number,
  textEffect: string,
): string | null {
  if (!sfxUrls || sfxUrls.length === 0) return null;
  const find = (kw: string) => sfxUrls.find(u => u.toLowerCase().includes(kw)) ?? null;

  if (segmentIndex === 0) return find('boom') ?? sfxUrls[0];
  if (segmentIndex === totalSegments - 1) return find('riser') ?? sfxUrls[sfxUrls.length - 1];
  if (textEffect === 'glitch') return find('glitch') ?? sfxUrls[segmentIndex % sfxUrls.length];
  if (textEffect === 'pop') return find('pop') ?? sfxUrls[segmentIndex % sfxUrls.length];
  return find('whoosh') ?? sfxUrls[segmentIndex % sfxUrls.length];
}

// ── WordTimestamp interface ───────────────────────────────────────────────────
interface WordTimestamp {
  word: string;
  start: number;     // seconds
  duration: number;  // seconds
}

// ── Karaoke Caption — word-by-word gold highlight ─────────────────────────────
// This is the #1 retention technique used by top Shorts channels.
// Each word turns gold + bold as the narrator speaks it, then fades back.
// A rolling window of ~8 words is always visible at the bottom of the frame.
const KaraokeCaption: React.FC<{ wordTimestamps: WordTimestamp[]; fps: number }> = ({
  wordTimestamps,
  fps,
}) => {
  const frame = useCurrentFrame();
  const currentTime = frame / fps;

  if (!wordTimestamps || wordTimestamps.length === 0) return null;

  // Find the index of the word currently being spoken
  let currentIdx = -1;
  for (let i = 0; i < wordTimestamps.length; i++) {
    if (currentTime >= wordTimestamps[i].start) {
      currentIdx = i;
    } else {
      break;
    }
  }

  if (currentIdx < 0) return null;

  // Show a rolling window: 3 words before + current + 4 words ahead
  const windowStart = Math.max(0, currentIdx - 3);
  const windowEnd   = Math.min(wordTimestamps.length - 1, currentIdx + 4);
  const visible     = wordTimestamps.slice(windowStart, windowEnd + 1);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: '28px',
        pointerEvents: 'none',
        zIndex: 6,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%)',
          borderRadius: '16px',
          padding: '16px 28px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px',
          maxWidth: '95%',
        }}
      >
        {visible.map((w, i) => {
          const absIdx  = windowStart + i;
          const isCurrent = absIdx === currentIdx;
          const isPast    = absIdx < currentIdx;

          // Pulse animation: scale up slightly when word becomes active
          const pulse = isCurrent
            ? spring({ frame: frame - Math.round(w.start * fps), fps, config: { damping: 15, stiffness: 300 } })
            : 1;

          return (
            <span
              key={absIdx}
              style={{
                fontFamily,
                fontSize:   isCurrent ? '52px' : '42px',
                fontWeight: isCurrent ? '900' : isPast ? '600' : '500',
                color:      isCurrent ? '#FFD700' : isPast ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.80)',
                textTransform: 'uppercase',
                textShadow: isCurrent
                  ? '0 0 20px rgba(255,215,0,0.9), 0 4px 12px rgba(0,0,0,0.9)'
                  : '0 2px 8px rgba(0,0,0,0.7)',
                WebkitTextStroke: isCurrent ? '1px rgba(0,0,0,0.5)' : 'none',
                transform:  `scale(${pulse})`,
                transition: 'color 0.05s, font-size 0.05s',
                lineHeight: 1.1,
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Main composition ──────────────────────────────────────────────────────────
export const MyComp: React.FC<{
  audioUrl: string;
  videoUrls: string[];
  sfxUrls?: string[];
  bgmUrl?: string;
  bgmVolume?: number;
  segments: Segment[];
  effects: EditorEffects;
  renderSeed?: number;
  category?: string;
  wordTimestamps?: WordTimestamp[];
}> = ({
  audioUrl,
  videoUrls,
  sfxUrls = [],
  bgmUrl,
  bgmVolume = 0.12,
  segments,
  effects,
  renderSeed = 0,
  category = 'general',
  wordTimestamps = [],
}) => {
    const { fps, durationInFrames } = useVideoConfig();
    const safeClipCount = Math.max(1, videoUrls?.length || 1);
    const framesPerClip = Math.ceil(durationInFrames / safeClipCount);
    const totalSegments = segments?.length ?? 0;

    return (
      <AbsoluteFill style={{ backgroundColor: 'black' }}>

        {/* Background clips — fast cuts via 10 clips over ~50s */}
        <Series>
          {videoUrls.map((url, i) => (
            <Series.Sequence key={i} durationInFrames={framesPerClip}>
              <ZoomingVideo
                url={url}
                effects={effects}
                clipDuration={framesPerClip}
                renderSeed={renderSeed}
              />
            </Series.Sequence>
          ))}
        </Series>

        {/* Cinematic overlays */}
        <Vignette />
        {/* CRT only for gaming — doesn't match science/history aesthetic */}
        {category === 'gaming' && <CRTOverlay />}
        <ProgressBar />
        <HookOverlay fps={fps} category={category} />

        {/* Voiceover — always dominant at 1.0 */}
        <Audio src={audioUrl} volume={1.0} />

        {/* BGM — atmosphere layer */}
        {bgmUrl && <Audio src={bgmUrl} volume={bgmVolume} loop />}

        {/* Karaoke captions — word-by-word gold highlight synced to voiceover */}
        <KaraokeCaption wordTimestamps={wordTimestamps} fps={fps} />

        {/* Captions + SFX per segment */}
        {segments?.map((s, i) => {
          const startFrame = Math.round(s.start * fps);
          const duration = Math.round((s.end - s.start) * fps);
          if (duration <= 0) return null;

          const sfxSrc = pickSfx(sfxUrls, i, totalSegments, s.text_effect ?? 'pop');
          const sfxDuration = Math.min(duration, 45);

          const sfxVol = i === 0
            ? SFX_VOL_HOOK
            : i === totalSegments - 1
              ? SFX_VOL_CTA
              : SFX_VOL_MID;

          return (
            <Sequence key={i} from={startFrame} durationInFrames={duration}>
              <AnimatedText segment={s} effects={effects} />
              {sfxSrc && (
                <Sequence from={0} durationInFrames={sfxDuration}>
                  <Audio src={sfxSrc} volume={sfxVol} />
                </Sequence>
              )}
            </Sequence>
          );
        })}
      </AbsoluteFill>
    );
  };