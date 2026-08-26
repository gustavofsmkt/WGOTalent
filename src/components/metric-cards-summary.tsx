import { Card, CardContent } from "./ui/card";

export default async function MetricCardsSummary({
  cards,
}: {
  cards: {
    title: string;
    info: string;
    icon: React.ReactNode;
    iconColor?: string;
  }[];
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-xs border-border/80 bg-card flex-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {card.info}
              </p>
            </div>
            <div
              className={`size-10 rounded-lg ${card.iconColor || "bg-primary/10"} flex items-center justify-center text-primary`}
            >
              {card.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
