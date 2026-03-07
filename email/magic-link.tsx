import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface MagicLinkEmailProps {
  email: string;
  magicLink: string;
}

export const MagicLinkEmail = ({ magicLink }: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Your login request to Scenify. Click the button below to log into Scenify. Your link expires
        in 1 hour.
      </Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section className="mt-[24px]">
              <Img
                src="https://cdn.designcombo.dev/combo-logo-black-2.png"
                width="32"
                height="32"
                alt="Scenify"
              />
            </Section>
            <Heading className="mx-0 my-[24px] p-0 text-[24px] font-semibold text-black">
              Your login request to Scenify
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Click the button below to log into Scenify. Your link expires in 1 hour.
            </Text>

            <Section className="mb-[24px] mt-[24px]">
              <Button
                className="rounded-lg bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={magicLink}
              >
                Log in
              </Button>
            </Section>
            <Text className="text-[14px] leading-[24px] text-black">
              If you're having trouble with the button above,{" "}
              <Link href={magicLink} className="text-blue-600 no-underline">
                click here
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default MagicLinkEmail;

export function sendMagicLinkEmail(props: MagicLinkEmailProps) {
  return <MagicLinkEmail {...props} />;
}
