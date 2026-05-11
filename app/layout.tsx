import Nav from "../components/Nav";

export default function RootLayout({ children, }: 
  {children: React.ReactNode;}) 
{
  return (
    <html lang="ko">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}