// Supabase connection (the anon key is safe to expose in frontend code).
const SUPABASE_URL = "https://cdayjixwyxzooaxyqyqz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkYXlqaXh3eXh6b29heHlxeXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNzQzMDcsImV4cCI6MjA5NzY1MDMwN30.CYzYS9VXLZLcioJEjpVd3MB2EqVKkOqn_0qr3ttL-Go";

// Create the client if the Supabase library loaded. If offline, sb stays null
// and the app still works locally (just without the leaderboard).
const sb = (window.supabase && SUPABASE_URL.startsWith("https://"))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
