//import Nav from "../components/Nav";

export default function RootLayout({ children, }: 
  {children: React.ReactNode;}) 
{
  return (
    <html lang="ko" style={{ height: "100%" }}>
      <body style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/*<Nav />*/}
        {children}
      </body>
    </html>
  );
}