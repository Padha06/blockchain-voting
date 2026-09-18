"use client";
export default function Manage({ params }: { params: { address: string } }) {
  return <main style={{ padding: 32 }}><h1>Manage {params.address}</h1><p>Start / stop / census.</p></main>;
}
