import AdditivesProductSelector from "./shared/components/AdditivesProductSelector";


export const dynamic = "force-dynamic";

export default function SharedSelectorPage() {
    return (
        <main className="min-h-screen bg-gray-50 p-3 md:p-6">
            <div className="mx-auto max-w-7xl">
                <AdditivesProductSelector
                    title="Additives Product Finder"
                    initialSlug="pcmo-gasoline"
                />
            </div>
        </main>
    );
}