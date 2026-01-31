from supabase import create_client, Client
from .config import settings


def get_supabase_client() -> Client:
    """Create and return a Supabase client instance."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def get_supabase_admin() -> Client:
    """Create and return a Supabase admin client with service role key."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


# Initialize clients
supabase: Client = get_supabase_client()
supabase_admin: Client = get_supabase_admin()
