import { useEffect, useRef } from "react";

const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";

export function MatrixRain({ className, fontSize = 15 }: { className?: string; fontSize?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !parent || !context) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let columns: number[] = [];
    let frame = 0;

    const fit = () => {
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.max(1, Math.ceil(width / fontSize));
      columns = Array.from({ length: count }, () => Math.random() * height);
    };

    const draw = (time: number) => {
      if (media.matches) return;
      if (time - frame < 40) {
        request = window.requestAnimationFrame(draw);
        return;
      }
      frame = time;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      context.clearRect(0, 0, width, height);
      context.font = `${fontSize}px "IBM Plex Mono", monospace`;
      for (let index = 0; index < columns.length; index += 1) {
        const y = columns[index] ?? 0;
        const lead = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "0";
        context.fillStyle = "#d8ffd8";
        context.fillText(lead, index * fontSize, y);
        context.fillStyle = "rgba(0, 255, 65, 0.72)";
        for (let trail = 1; trail < 14; trail += 1) {
          const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "0";
          context.globalAlpha = Math.max(0, 0.72 - trail * 0.05);
          context.fillText(glyph, index * fontSize, y - trail * fontSize);
        }
        context.globalAlpha = 1;
        columns[index] = y > height + fontSize * 14 && Math.random() > 0.96 ? 0 : y + fontSize;
      }
      request = window.requestAnimationFrame(draw);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(parent);
    let request = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(request);
      observer.disconnect();
    };
  }, [fontSize]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
