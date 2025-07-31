export default function isAuthorized(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.split(" ")[1] || "";
  const { CRON_SECRET, JWT_SECRET } = process.env;
  return (
    (CRON_SECRET && token === CRON_SECRET) ||
    (JWT_SECRET && token === JWT_SECRET)
  );
}