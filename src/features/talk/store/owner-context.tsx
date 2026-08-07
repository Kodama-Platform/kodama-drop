import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { talkService } from "@/features/talk/services";
import type { OwnerSession, Shelf } from "@/features/talk/types";

interface OwnerCtx {
  session: OwnerSession;
  shelf: Shelf | null;
  loading: boolean;
  refresh: () => Promise<void>;
  lock: () => void;
  forget: () => void;
}

const Ctx = createContext<OwnerCtx | null>(null);

export function OwnerProvider({
  session,
  onLock,
  children,
}: {
  session: OwnerSession;
  onLock: () => void;
  children: ReactNode;
}) {
  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await talkService.getShelf(session);
    setShelf(next);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const lock = useCallback(() => onLock(), [onLock]);
  const forget = useCallback(() => {
    talkService.forgetDevice(session.address);
    onLock();
  }, [session.address, onLock]);

  return (
    <Ctx.Provider value={{ session, shelf, loading, refresh, lock, forget }}>{children}</Ctx.Provider>
  );
}

export function useOwner(): OwnerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOwner must be used within OwnerProvider");
  return ctx;
}
