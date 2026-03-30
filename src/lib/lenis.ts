import Lenis from "lenis";

let lenisInstance: Lenis | null = null;

export const getLenis = (forceNew = false): Lenis => {
  if (typeof window === "undefined") return {} as Lenis;
  
  if (!lenisInstance || forceNew) {
    if (lenisInstance) lenisInstance.destroy();
    
    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      lerp: 0.15,
      syncTouch: false,
    });

    // Handle frame updates
    const raf = (time: number) => {
      lenisInstance?.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
  return lenisInstance;
};


export const scrollToPosition = (y: number): void => {
  if (typeof window !== "undefined") {
    getLenis().scrollTo(y, { immediate: false, duration: 0.8 });
  }
};

export const resizeLenis = (): void => {
  if (lenisInstance && typeof window !== "undefined") {
    lenisInstance.resize();
  }
};


