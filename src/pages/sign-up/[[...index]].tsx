import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Page() {
  return (
    <div className="flex h-screen w-full content-center justify-center bg-black">
      <SignUp appearance={{ baseTheme: dark, elements: {
        card: 'mt-10'
      } }} />
    </div>
  );
}