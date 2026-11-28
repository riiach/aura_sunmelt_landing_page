// Preview editorial copy. Partner interviews and revenue outcomes must be
// verified before replacing these editorial concepts with published claims.
export interface Story {
    slug: string;
    category: string;
    title: string;
    photo: string;
    fallback: string;
    position: string;
    draft?: boolean;
    intro: string;
    sections: { heading: string; text: string }[];
}

export const stories: Story[] = [
    {
        slug: "a-brighter-kind-of-soda", category: "Sunmelt Journal",
        title: "A brighter kind of soda", photo: "photo-1544145945-f90425340c7e", fallback: "mango", position: "50% 50%",
        intro: "Sunmelt brings together fruit, botanical flavors and a little sparkle. It is a fresh way to enjoy an everyday moment.",
        sections: [{ heading: "A taste of sunshine", text: "Mango Glow pairs mango purée with yuzu and calendula. Discover the different flavor combinations and find the one that feels like your kind of sunshine." }],
    },
    {
        slug: "behind-the-counter", category: "Founder Stories",
        title: "Behind the counter: a chicken shop owner's story", photo: "photo-1517248135467-4c7edcad34c4", fallback: "peach", position: "50% 50%", draft: true,
        intro: "An upcoming conversation with a chicken shop owner about building a business, creating a welcoming space and choosing drinks that complement the menu.",
        sections: [{ heading: "Behind the counter", text: "The full interview will explore the owner's journey, everyday decisions and experience introducing Sunmelt. Interview details are pending." }],
    },
    {
        slug: "growing-sales-with-sunmelt", category: "Business Stories",
        title: "Growing sales with Sunmelt on the menu", photo: "photo-1562967914-608f82629710", fallback: "pomegranate", position: "50% 50%", draft: true,
        intro: "An upcoming business story exploring how a new beverage can fit into a restaurant's menu and customer experience.",
        sections: [{ heading: "A new addition to the menu", text: "We plan to look at drink pairings, customer feedback and sales performance before and after introduction. Verified results and figures will be added when available." }],
    },
    {
        slug: "a-little-sunshine", category: "Food & Drink",
        title: "A little sunshine with every bite", photo: "photo-1552566626-52f8b828add9", fallback: "lychee", position: "50% 50%",
        intro: "A refreshing soda can bring a different note to a favorite meal. Think bright fruit flavors alongside a warm, savory bite.",
        sections: [{ heading: "Find your pairing", text: "Try Mango Glow with crispy chicken, or explore the other Sunmelt flavors to find your favorite combination." }],
    },
    {
        slug: "from-nature-to-your-glass", category: "Sunmelt Journal",
        title: "From nature to your glass", photo: "photo-1546069901-ba9599a7e63c", fallback: "grape", position: "50% 50%",
        intro: "Our flavor inspiration starts with fruit and botanicals, from mango and yuzu to calendula.",
        sections: [{ heading: "Inspired by nature", text: "Each flavor brings its own character to sparkling soda. Explore the ingredients and discover the combinations behind Sunmelt." }],
    },
];
export const storyImage = (story: Story, width = 1400) =>
    `https://images.unsplash.com/${story.photo}?auto=format&fit=crop&w=${width}&q=80`;
