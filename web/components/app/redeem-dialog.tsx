"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { redeemRewardAction } from "@/lib/actions/redeem-reward";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface RedeemDialogProps {
  rewardId: string;
  rewardTitle: string;
  costPoints: number;
  rewardType: "digital_badge" | "physical_item" | "conversion";
  affordable: boolean;
  missingPoints: number;
}

type DialogState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "success"; voucherCode: string }
  | { phase: "error"; error: string };

export function RedeemDialog({
  rewardId,
  rewardTitle,
  costPoints,
  rewardType,
  affordable,
  missingPoints,
}: RedeemDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<DialogState>({ phase: "idle" });

  async function handleConfirm() {
    setState({ phase: "loading" });
    try {
      const result = await redeemRewardAction(rewardId);
      if (result.ok) {
        setState({ phase: "success", voucherCode: result.voucherCode });
      } else {
        setState({ phase: "error", error: result.error });
      }
    } catch {
      setState({ phase: "error", error: "unknown" });
    }
  }

  function handleClose() {
    // Apos sucesso, hard reload para garantir saldo atualizado em toda a UI
    // (router.refresh() do Next 16 nao invalida o cache RSC de forma confiavel aqui).
    if (state.phase === "success") {
      window.location.reload();
      return;
    }
    setOpen(false);
    setTimeout(() => setState({ phase: "idle" }), 200);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger
        render={
          <Button
            size="lg"
            disabled={!affordable}
            className="w-full font-mono uppercase tracking-wider"
          />
        }
      >
        {affordable ? "Resgatar agora" : `Faltam ${missingPoints} pts`}
      </DialogTrigger>
      <DialogContent>
        {state.phase === "idle" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar resgate</DialogTitle>
              <DialogDescription>
                Você está prestes a resgatar <strong>{rewardTitle}</strong>.
                Isso vai debitar <strong>{costPoints} pts</strong> do seu saldo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm}>Sim, resgatar</Button>
            </DialogFooter>
          </>
        )}

        {state.phase === "loading" && (
          <div className="py-10 text-center space-y-3">
            <p className="text-muted-foreground">Processando resgate...</p>
          </div>
        )}

        {state.phase === "success" && (
          <>
            <DialogHeader className="items-center text-center space-y-2">
              <div className="rounded-full bg-accent p-3">
                <CheckCircle2 className="h-7 w-7 text-accent-foreground" />
              </div>
              <DialogTitle>Resgate realizado!</DialogTitle>
              <DialogDescription>
                {rewardType === "digital_badge"
                  ? "Seu selo já está vinculado ao seu perfil."
                  : rewardType === "physical_item"
                    ? "Apresente o código abaixo no estande de retirada."
                    : "Use este código no programa associado para resgatar o benefício."}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-border bg-muted p-4 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Código do voucher
              </p>
              <p className="font-mono text-base font-bold tracking-wider break-all">
                {state.voucherCode}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Fechar
              </Button>
            </DialogFooter>
          </>
        )}

        {state.phase === "error" && (
          <>
            <DialogHeader className="items-center text-center space-y-2">
              <AlertCircle className="h-7 w-7 text-destructive" />
              <DialogTitle>Não foi possível resgatar</DialogTitle>
              <DialogDescription>
                {state.error === "insufficient_points"
                  ? "Seu saldo não cobre o custo desta recompensa."
                  : state.error === "out_of_stock"
                    ? "Esta recompensa está fora de estoque."
                    : "Algo deu errado. Tente novamente em instantes."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleClose} variant="outline" className="w-full">
                Fechar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
