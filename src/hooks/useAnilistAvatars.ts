import { useEffect, useState } from "react";

const ANILIST_QUERY = `
query {
  Page(page: 1, perPage: 20) {
    characters(sort: FAVOURITES_DESC) {
      image {
        medium
      }
    }
  }
}
`;

export const useAnilistAvatars = () => {
  const [avatars, setAvatars] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: ANILIST_QUERY }),
        });
        const json = await res.json();
        const urls: string[] =
          json?.data?.Page?.characters
            ?.map((c: { image: { medium: string } }) => c.image.medium)
            .filter(Boolean) ?? [];
        setAvatars(urls);
      } catch (error) {
        console.error("Error fetching avatars:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatars();
  }, []);

  return { avatars, loading };
};
