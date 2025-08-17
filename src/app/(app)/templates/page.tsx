"use client";

import dynamic from "next/dynamic";

const MainContainer = dynamic(
	() => import("../../../features/templates/containers/main-container"),
	{ ssr: false },
);

export default function Page() {
	return <MainContainer />;
}
