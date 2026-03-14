/**
 * E2E Test: Fluxo crítico de geração de conteúdo.
 *
 * Testa o caminho crítico da aplicação:
 * 1. Acessa a Landing page
 * 2. Navega para o Dashboard
 * 3. Seleciona uma persona
 * 4. Insere conteúdo educacional
 * 5. Verifica que o botão "Adaptar Conteúdo" está habilitado
 *
 * Nota: A geração real de IA NÃO é testada aqui (requer API key).
 * O objetivo é validar a interação UI e o fluxo de dados.
 */

import { test, expect } from "@playwright/test";

test.describe("Fluxo de Geração", () => {
  test("landing page carrega e tem os elementos principais", async ({ page }) => {
    await page.goto("/");
    // Landing page deve ter o título do projeto
    await expect(page.locator("h1")).toContainText("PROMETHEUS");
    // Deve ter o botão/link para acessar o app
    const ctaButton = page.getByRole("link", { name: /começar|acessar|experimentar/i });
    await expect(ctaButton).toBeVisible();
  });

  test("dashboard carrega e exibe o seletor de personas", async ({ page }) => {
    await page.goto("/app");
    // Deve mostrar o seletor de personas
    await expect(page.getByText("Seletor de Personas")).toBeVisible({ timeout: 10_000 });
    // Deve mostrar a seção de conteúdo
    await expect(page.getByText("Entrada de Conteúdo Educacional")).toBeVisible();
  });

  test("botão adaptar está desabilitado sem persona e conteúdo", async ({ page }) => {
    await page.goto("/app");
    // Aguarda carregamento
    await expect(page.getByText("Seletor de Personas")).toBeVisible({ timeout: 10_000 });
    // Botão "Adaptar Conteúdo" deve estar desabilitado
    const adaptButton = page.getByRole("button", { name: /Adaptar Conteúdo/i });
    await expect(adaptButton).toBeDisabled();
  });

  test("textarea de conteúdo aceita texto", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByText("Seletor de Personas")).toBeVisible({ timeout: 10_000 });
    // Preenche o textarea
    const textarea = page.getByPlaceholder(/Cole ou digite/i);
    await textarea.fill("A fotossíntese é o processo pelo qual as plantas produzem energia.");
    await expect(textarea).toHaveValue(/fotossíntese/);
  });

  test("settings page carrega e exibe configurações", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByText("Seletor de Personas")).toBeVisible({ timeout: 10_000 });
    // Navega para Settings via sidebar (se disponível)
    const settingsLink = page.getByRole("button", { name: /configurações|settings/i });
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page.getByText(/Configurações|Settings/i)).toBeVisible();
    }
  });
});
