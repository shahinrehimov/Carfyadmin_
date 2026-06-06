import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { controlPrivateApi } from "@/lib/axios/controlPrivateApi";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/utils/translationLoader";

interface UserResult {
  id: number;
  full_name: string;
  email: string;
}

interface Props {
  value: UserResult | null;
  onChange: (user: UserResult | null) => void;
  placeholder?: string;
}

async function searchUsers(search: string): Promise<UserResult[]> {
  const res = await controlPrivateApi.get(
    `/users/load?search=${encodeURIComponent(search)}&page=1`
  );
  return (res.data.data ?? []).slice(0, 10);
}

export function UserAsyncSelect({ value, onChange, placeholder }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["user-async-search", debounced],
    queryFn: () => searchUsers(debounced),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  const handleSelect = (user: UserResult) => {
    onChange(user);
    setQuery("");
    setDebounced("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setDebounced("");
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{value.full_name}</p>
          <p className="text-xs text-gray-500 truncate">{value.email} · ID: {value.id}</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={placeholder || t("search_user") || "İstifadəçi axtar..."}
          className="w-full border border-gray-300 rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-primary"
          autoComplete="off"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 w-4 h-4 text-gray-400 animate-spin" />
        )}
        {query && !isFetching && (
          <button
            type="button"
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && debounced.length >= 2 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {isFetching ? (
            <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("loading") || "Yüklənir..."}
            </div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user)}
                className={cn(
                  "w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                )}
              >
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500">{user.email} · ID: {user.id}</p>
              </button>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-gray-400">
              {t("no_users_found") || "İstifadəçi tapılmadı"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
