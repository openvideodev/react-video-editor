import Image from "next/image";

const Footer = () => {
  return (
    <>
      <footer className="flex flex-col border-t gap-12  h-fit px-10 pt-28  ">
        <div className="flex items-end justify-end relative">
          <Image
            src="/text-logo.svg"
            width={0}
            height={0}
            sizes="100vw"
            alt="OpenVideo - The Open Source Video Engine for the Web"
            className="pointer-events-none w-full h-auto relative z-10"
            style={{
              filter: "brightness(30%)",
              maskImage:
                "linear-gradient(to top, transparent 0%, var(--foreground) 100%)",
              WebkitMaskImage:
                "linear-gradient(to top, transparent 0%, var(--foreground) 100%)",
            }}
          />
        </div>
      </footer>
    </>
  );
};

export default Footer;
