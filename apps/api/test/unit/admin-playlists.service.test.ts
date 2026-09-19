import { extractPlaylistId } from "../../src/modules/videos/admin-playlists.service";

/**
 * Cobertura unitária de extractPlaylistId (Story 10.5 / QA gate ARCH-001).
 * O caminho feliz (URL absoluta e id puro) já é coberto pelo teste de
 * integração admin-playlists.test.ts; aqui cobrimos especificamente o
 * fallback de URL colada sem protocolo, achado não bloqueante do gate.
 */
describe("extractPlaylistId (Story 10.5)", () => {
  it("URL absoluta com list= → extrai o playlistId", () => {
    expect(extractPlaylistId("https://www.youtube.com/playlist?list=PLxxxx")).toBe("PLxxxx");
  });

  it("id puro (sem URL) → retorna a própria string", () => {
    expect(extractPlaylistId("PLxxxx")).toBe("PLxxxx");
  });

  it("URL colada sem protocolo com list= → fallback via regex extrai o playlistId (ARCH-001)", () => {
    expect(extractPlaylistId("playlist?list=PLxxxx")).toBe("PLxxxx");
  });

  it("URL colada sem protocolo, list= no meio de outros query params → extrai corretamente", () => {
    expect(extractPlaylistId("www.youtube.com/playlist?foo=bar&list=PLxxxx&si=abc")).toBe("PLxxxx");
  });

  it("URL colada sem protocolo e sem list= → retorna a própria string (comportamento pré-existente preservado)", () => {
    expect(extractPlaylistId("playlist?foo=bar")).toBe("playlist?foo=bar");
  });

  it("espaços em volta são removidos (trim) em todos os casos", () => {
    expect(extractPlaylistId("  PLxxxx  ")).toBe("PLxxxx");
    expect(extractPlaylistId("  playlist?list=PLxxxx  ")).toBe("PLxxxx");
  });
});
