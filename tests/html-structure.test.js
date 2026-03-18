const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const htmlPath = path.join(__dirname, '..', 'index.html');
let $;

beforeAll(() => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  $ = cheerio.load(html);
});

describe('index.html — document basics', () => {
  test('file exists', () => {
    expect(fs.existsSync(htmlPath)).toBe(true);
  });

  test('has <!DOCTYPE html>', () => {
    const raw = fs.readFileSync(htmlPath, 'utf8');
    expect(raw.toLowerCase()).toMatch(/<!doctype html>/);
  });

  test('has a <title> element', () => {
    expect($('title').length).toBe(1);
  });

  test('has a viewport meta tag', () => {
    const viewport = $('meta[name="viewport"]');
    expect(viewport.length).toBe(1);
    expect(viewport.attr('content')).toMatch(/width=device-width/);
  });

  test('links to manifest.json', () => {
    const manifest = $('link[rel="manifest"]');
    expect(manifest.length).toBe(1);
    expect(manifest.attr('href')).toBe('manifest.json');
  });

  test('links to styles.css', () => {
    const stylesheet = $('link[rel="stylesheet"]');
    expect(stylesheet.length).toBeGreaterThanOrEqual(1);
    const hrefs = stylesheet.toArray().map(el => $(el).attr('href'));
    expect(hrefs).toContain('styles.css');
  });

  test('links to app.js', () => {
    const scripts = $('script');
    const srcs = scripts.toArray().map(el => $(el).attr('src')).filter(Boolean);
    expect(srcs).toContain('app.js');
  });
});

describe('index.html — layout shell', () => {
  test('has a <header> element', () => {
    expect($('header').length).toBeGreaterThanOrEqual(1);
  });

  test('has a <main> element', () => {
    expect($('main').length).toBe(1);
  });

  test('has a <nav> element', () => {
    expect($('nav').length).toBeGreaterThanOrEqual(1);
  });
});
