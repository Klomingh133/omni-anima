import React from 'react';

interface FeatureItem {
  num: string;
  title: string;
  subtitle: string;
  desc: string;
  metricLabel: string;
  metricValue: string;
}

const features: FeatureItem[] = [
  {
    num: '01',
    title: 'HEADLESS 2D ENGINE',
    subtitle: 'Direct Canvas Buffer Processing',
    desc: 'Input events dispatch straight to virtual 960×540 pixel buffers. Strokes rasterize in single-pass O(1) complexity, sustaining smooth 60 FPS drawing even under heavy tablet pressure.',
    metricLabel: 'BUFFER DIMENSION',
    metricValue: '960×540 PIXELS',
  },
  {
    num: '02',
    title: 'ARCHITECTURAL ONION SKIN',
    subtitle: 'Dual-Layer Ghosting Alignment',
    desc: 'Inspect previous and subsequent frames with translucent blueprint guides. Keep character proportions locked, pacing calibrated, and motion arcs fluid.',
    metricLabel: 'SKINNING LAYERS',
    metricValue: 'PREV + NEXT GHOSTING',
  },
  {
    num: '03',
    title: 'VIDEO REMIX & DECODER',
    subtitle: 'Client-Side Frame Deconstruction',
    desc: 'Import MP4 or WebM video footage to decompose it into rotoscope sketch sequences. Draw on top of real action frames and export back to broadcast-quality WebM.',
    metricLabel: 'VIDEO DECODER',
    metricValue: 'CLIENT-SIDE HTML5',
  },
  {
    num: '04',
    title: 'COMMUNITY SHOWCASE',
    subtitle: 'Shared Animation Blueprint Network',
    desc: 'Publish your finished animations directly to the public community reel. Explore creations, examine timings, and inspect peer motion blueprints.',
    metricLabel: 'BROADCAST FORMAT',
    metricValue: 'VP9 WEBM BITSTREAM',
  },
];

export function BentoFeatures() {
  return (
    <section id="features" className="py-20 bg-[#f8f8f8] border-b border-[#1f00ff]">
      <div id="workflow" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1f00ff] rounded-[5px] bg-white mb-4">
            <span className="font-mono text-xs font-semibold text-[#1f00ff] uppercase tracking-wider">
              SPECIFICATIONS & CAPABILITIES
            </span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#1f00ff] leading-[0.92]">
            ENGINEERED FOR PRECISION DRAFTING.
          </h2>
          <p className="text-base text-[#212121] mt-3 max-w-2xl">
            Built from first principles for performance. No sluggish canvas abstractions or bloated dependencies.
          </p>
        </div>

        {/* 4-Card Blueprint Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((item) => (
            <div
              key={item.num}
              className="bg-white border border-[#1f00ff] rounded-[5px] p-8 flex flex-col justify-between hover:border-[#1700c2] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  {/* Numbered structural box */}
                  <div className="w-10 h-10 border border-[#1f00ff] rounded-[5px] flex items-center justify-center font-display text-xl font-bold text-[#1f00ff]">
                    {item.num}
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#212121] font-semibold">
                    SUBSYSTEM // {item.num}
                  </span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#1f00ff] leading-[0.92] mb-2">
                  {item.title}
                </h3>
                <p className="text-xs font-mono uppercase tracking-wider font-semibold text-[#1f00ff] mb-4">
                  {item.subtitle}
                </p>
                <p className="text-sm text-[#212121] leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#ececec] flex items-center justify-between text-xs font-mono text-[#212121]">
                <span>{item.metricLabel}</span>
                <span className="font-bold text-[#1f00ff]">{item.metricValue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
