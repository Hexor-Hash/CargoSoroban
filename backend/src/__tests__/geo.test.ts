import { haversineDistance, estimateETA } from '../services/geo';

describe('haversineDistance', () => {
  it('returns ~340 km between London and Paris', () => {
    // London: 51.5074, -0.1278  |  Paris: 48.8566, 2.3522
    const dist = haversineDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(330);
    expect(dist).toBeLessThan(350);
  });

  it('returns 0 for identical coordinates', () => {
    const dist = haversineDistance(0, 0, 0, 0);
    expect(dist).toBe(0);
  });

  it('returns a positive value for any two distinct points', () => {
    const dist = haversineDistance(0, 0, 1, 1);
    expect(dist).toBeGreaterThan(0);
  });
});

describe('estimateETA', () => {
  it('returns correct minutes for 100 km at default 40 km/h', () => {
    // 100 / 40 * 60 = 150 minutes
    expect(estimateETA(100)).toBe(150);
  });

  it('returns correct minutes with custom speed', () => {
    // 60 km at 60 km/h = 60 minutes
    expect(estimateETA(60, 60)).toBe(60);
  });

  it('returns 0 for 0 km distance', () => {
    expect(estimateETA(0)).toBe(0);
  });
});
