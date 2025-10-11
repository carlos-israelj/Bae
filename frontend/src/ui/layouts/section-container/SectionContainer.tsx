import React from "react";

interface SectionContainerProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export default function SectionContainer({
  children,
  id,
  className = "",
}: SectionContainerProps) {
  return (
    <section
      id={id}
      className={`container-responsive py-16 md:py-24 ${className}`}
    >
      {children}
    </section>
  );
}
