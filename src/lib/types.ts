export type TierItem = {
    id: string;
    url: string;
    note?: string;
};

export type TierRow = {
    id: string;
    label: string;
    color: string;
    items: TierItem[];
};