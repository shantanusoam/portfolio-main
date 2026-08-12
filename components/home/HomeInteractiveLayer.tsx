"use client";

import dynamic from "next/dynamic";

const EntranceWipe = dynamic(() => import("@/components/ui/EntranceWipe"), { ssr: false });
const ComboTrail = dynamic(() => import("@/components/ui/ComboTrail"), { ssr: false });
const StickyCursor = dynamic(() => import("@/components/ui/stickyCursor/StickyCursor"), { ssr: false });
const SecretArcade = dynamic(() => import("@/components/easter-egg/SecretArcade"), { ssr: false });

export default function HomeInteractiveLayer() {
  return <><EntranceWipe /><ComboTrail /><StickyCursor /><SecretArcade /></>;
}
