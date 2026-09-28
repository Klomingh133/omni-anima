import React from 'react';

export function BentoFeatures() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-4 py-16">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="text-xs font-bold uppercase tracking-wider text-[#4f46e5] mb-2">
          STUDIO ARCHITECTURE
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a] mb-3">
          Engineered for Modern Animators
        </h2>
        <p className="text-base text-[#64748b] max-w-xl mx-auto">
          All the essential tools you need to create fluid, frame-by-frame animations right in your web browser.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Span 2 */}
        <div className="md:col-span-2 bg-white border border-[#e2e8f0] hover:border-[#c7d2fe] rounded-2xl p-7 flex flex-col justify-between shadow-[0_4px_18px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_30px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-200">
          <div>
            <div className="w-11 h-11 rounded-xl bg-[#eef2ff] border border-[#c7d2fe] text-[#4f46e5] flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0f172a] mb-2 tracking-tight">
              Ultra-Responsive Vector &amp; Raster Brushes
            </h3>
            <p className="text-sm text-[#64748b] leading-relaxed mb-5">
              Dynamic pressure sensitivity, instant flood fill, geometric shapes (lines, rectangles, ellipses), and transform selection tools that run smoothly with GPU acceleration.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap pt-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#f1f5f9] text-[#334155]">Pressure Brush</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#f1f5f9] text-[#334155]">Smart Flood Fill</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#f1f5f9] text-[#334155]">Precision Primitives</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#f1f5f9] text-[#334155]">Sub-Pixel Eraser</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#f1f5f9] text-[#334155]">Select &amp; Move</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#e2e8f0] hover:border-[#c7d2fe] rounded-2xl p-7 flex flex-col justify-between shadow-[0_4px_18px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_30px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-200">
          <div>
            <div className="w-11 h-11 rounded-xl bg-[#eef2ff] border border-[#c7d2fe] text-[#4f46e5] flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0f172a] mb-2 tracking-tight">
              Multi-Layer Onion Skinning
            </h3>
            <p className="text-sm text-[#64748b] leading-relaxed mb-5">
              Preview previous and upcoming frames transparently with custom opacity controls and automatic background detection.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#eef2ff] text-[#4f46e5]">
              Previous &amp; Next Frame Ghosting
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#e2e8f0] hover:border-[#c7d2fe] rounded-2xl p-7 flex flex-col justify-between shadow-[0_4px_18px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_30px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-200">
          <div>
            <div className="w-11 h-11 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#10b981] flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0f172a] mb-2 tracking-tight">
              Community Remix Reel
            </h3>
            <p className="text-sm text-[#64748b] leading-relaxed mb-5">
              Explore animations created by fellow artists, preview their keyframe timing, and share your published loops with 1 click.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#ecfdf5] text-[#10b981]">
              Shared Animation Reel
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#e2e8f0] hover:border-[#c7d2fe] rounded-2xl p-7 flex flex-col justify-between shadow-[0_4px_18px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_30px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-200">
          <div>
            <div className="w-11 h-11 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0f172a] mb-2 tracking-tight">
              Collision-Proof Cloud Autosave
            </h3>
            <p className="text-sm text-[#64748b] leading-relaxed mb-5">
              Automatic debounced synchronization ensures no strokes are lost. Offline in-memory caching keeps you animating without worry.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#eff6ff] text-[#2563eb]">
              Debounced Sync &amp; Zero Frame Loss
            </span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white border border-[#e2e8f0] hover:border-[#c7d2fe] rounded-2xl p-7 flex flex-col justify-between shadow-[0_4px_18px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_30px_rgba(79,70,229,0.08)] hover:-translate-y-1 transition-all duration-200">
          <div>
            <div className="w-11 h-11 rounded-xl bg-[#fffbeb] border border-[#fde68a] text-[#f59e0b] flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0f172a] mb-2 tracking-tight">
              Universal Media Export
            </h3>
            <p className="text-sm text-[#64748b] leading-relaxed mb-5">
              Compile your animations into high-definition WebM loops, lightweight animated GIFs for social media, or JSON project archives.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#fffbeb] text-[#f59e0b]">
              WebM 60 FPS • GIF • JSON Archive
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
