import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { periodo, rotuloPeriodo, personalizado, PERIODOS, dataLocal } from "@/lib/format";
import { PeriodPills } from "@/components/kit";

const HOJE = new Date(2026, 9, 6, 22, 30); // 06/10/2026 22h30 no fuso local

describe("período do filtro", () => {
  it("opções na ordem pedida", () => {
    expect(PERIODOS.map((p) => p.label)).toEqual([
      "Hoje",
      "Ontem",
      "7 dias",
      "14 dias",
      "21 dias",
      "28 dias",
      "60 dias",
      "90 dias",
    ]);
  });
  it("hoje, ontem, N dias e personalizado", () => {
    expect(periodo("hoje", HOJE)).toEqual({ de: "2026-10-06", ate: "2026-10-06" });
    expect(periodo("ontem", HOJE)).toEqual({ de: "2026-10-05", ate: "2026-10-05" });
    expect(periodo("7", HOJE)).toEqual({ de: "2026-09-30", ate: "2026-10-06" });
    expect(periodo("28", HOJE)).toEqual({ de: "2026-09-09", ate: "2026-10-06" });
    expect(periodo("90", HOJE).de).toBe("2026-07-09");
    expect(periodo(personalizado("2026-09-01", "2026-09-30"), HOJE)).toEqual({
      de: "2026-09-01",
      ate: "2026-09-30",
    });
    // invertido é corrigido; inválido cai no padrão de 28 dias
    expect(periodo("c:2026-09-30:2026-09-01", HOJE)).toEqual({
      de: "2026-09-01",
      ate: "2026-09-30",
    });
    expect(periodo("c:lixo", HOJE)).toEqual(periodo("28", HOJE));
    expect(periodo("abc", HOJE)).toEqual(periodo("28", HOJE));
    // valores antigos continuam funcionando
    expect(periodo("30", HOJE).de).toBe("2026-09-07");
  });
  it("usa o dia local, não o UTC (22h30 ainda é hoje)", () => {
    expect(dataLocal(HOJE)).toBe("2026-10-06");
  });
  it("rótulo do personalizado", () => {
    expect(rotuloPeriodo("c:2026-09-01:2026-09-30")).toBe("01/09 – 30/09");
    expect(rotuloPeriodo("c:2026-09-15:2026-09-15")).toBe("15/09");
    expect(rotuloPeriodo("14")).toBe("14 dias");
  });
});

describe("filtro de período na tela", () => {
  function Teste({ espia }: { espia: (v: string) => void }) {
    const [v, setV] = useState("28");
    return (
      <PeriodPills
        value={v}
        onChange={(x) => {
          setV(x);
          espia(x);
        }}
      />
    );
  }
  it("escolhe pílula e aplica um período personalizado", () => {
    const espia = vi.fn();
    render(<Teste espia={espia} />);
    fireEvent.click(screen.getByRole("button", { name: "Ontem" }));
    expect(espia).toHaveBeenLastCalledWith("ontem");
    fireEvent.click(screen.getByRole("button", { name: /Personalizado/ }));
    const [de, ate] = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/) as HTMLInputElement[];
    fireEvent.change(de!, { target: { value: "2026-09-30" } });
    fireEvent.change(ate!, { target: { value: "2026-09-01" } });
    expect(screen.getByText("A data inicial vem depois da final.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Aplicar" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.change(de!, { target: { value: "2026-09-01" } });
    fireEvent.change(ate!, { target: { value: "2026-09-30" } });
    expect(screen.getByText("30 dias")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    expect(espia).toHaveBeenLastCalledWith("c:2026-09-01:2026-09-30");
    expect(screen.getByRole("button", { name: /01\/09 – 30\/09/ })).toBeTruthy();
  });
});
