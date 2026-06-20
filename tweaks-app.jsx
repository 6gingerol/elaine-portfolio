/* tweaks-app.jsx — mounts the Tweaks panel and feeds the cursor engine.
   The cursor (cursor.js, vanilla) reads values via window.__cursor.set on
   mount and on every change, so persisted tweaks apply on reload too. */
const CURSOR_TWEAKS = /*EDITMODE-BEGIN*/{
  "cursorStyle": "Circle",
  "cursorSize": 22,
  "cursorShade": "#6c6c70",
  "cursorShrink": 55,
  "cursorFeel": "Smooth"
}/*EDITMODE-END*/;

function mapToCursor(t) {
  return {
    mode: String(t.cursorStyle).toLowerCase(),
    size: t.cursorSize,
    color: t.cursorShade,
    shrink: 1 - t.cursorShrink / 100,
    trail: ({ Snappy: 0.34, Smooth: 0.22, Liquid: 0.12 })[t.cursorFeel] || 0.22
  };
}

function CursorTweaks() {
  const [t, setTweak] = useTweaks(CURSOR_TWEAKS);

  // push to the vanilla cursor engine on mount + whenever a value changes
  React.useEffect(() => {
    if (window.__cursor) window.__cursor.set(mapToCursor(t));
  }, [t.cursorStyle, t.cursorSize, t.cursorShade, t.cursorShrink, t.cursorFeel]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Cursor" />
      <TweakRadio
        label="Style" value={t.cursorStyle} options={['Circle', 'Cloud']}
        onChange={(v) => setTweak('cursorStyle', v)} />
      <TweakSlider
        label="Size" value={t.cursorSize} min={12} max={40} step={1} unit="px"
        onChange={(v) => setTweak('cursorSize', v)} />
      <TweakColor
        label="Shade" value={t.cursorShade}
        options={['#c0c0c4', '#9a9a9e', '#6c6c70', '#2b2b2d']}
        onChange={(v) => setTweak('cursorShade', v)} />
      <TweakSlider
        label="Click shrink" value={t.cursorShrink} min={20} max={80} step={5} unit="%"
        onChange={(v) => setTweak('cursorShrink', v)} />
      <TweakRadio
        label="Feel" value={t.cursorFeel} options={['Snappy', 'Smooth', 'Liquid']}
        onChange={(v) => setTweak('cursorFeel', v)} />
    </TweaksPanel>
  );
}

(function mountTweaks() {
  const host = document.createElement('div');
  host.id = 'tweaks-root';
  document.body.appendChild(host);
  ReactDOM.createRoot(host).render(<CursorTweaks />);
})();
