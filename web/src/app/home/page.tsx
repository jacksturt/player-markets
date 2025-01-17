import PlayerCard from "@/components/home/player-card";

const playerData = [
  {
    imageUrl: "/player-temp/mahomes.png",
    name: "Patrick Mahomes",
    position: "Quarterback",
    projectedTotal: 325,
    pctChange: 12.5,
  },
  {
    imageUrl: "/player-temp/allen.jpg",
    name: "Josh Allen",
    position: "Quarterback",
    projectedTotal: 310,
    pctChange: 8.2,
  },
  {
    imageUrl: "/player-temp/mccaffrey.png",
    name: "Christian McCaffrey",
    position: "Running Back",
    projectedTotal: 245,
    pctChange: 15.3,
  },
  {
    imageUrl: "/player-temp/jefferson.webp",
    name: "Justin Jefferson",
    position: "Wide Receiver",
    projectedTotal: 205,
    pctChange: -3.2,
  },
  {
    imageUrl: "/player-temp/hill.png",
    name: "Tyreek Hill",
    position: "Wide Receiver",
    projectedTotal: 190,
    pctChange: 8.9,
  },
  {
    imageUrl: "/player-temp/kittle.webp",
    name: "George Kittle",
    position: "Tight End",
    projectedTotal: 160,
    pctChange: 3.4,
  },
  {
    imageUrl: "/player-temp/herbert.jpg",
    name: "Justin Herbert",
    position: "Quarterback",
    projectedTotal: 280,
    pctChange: 5.6,
  },
  {
    imageUrl: "/player-temp/chubb.jpg",
    name: "Nick Chubb",
    position: "Running Back",
    projectedTotal: 195,
    pctChange: -1.8,
  },
  {
    imageUrl: "/player-temp/diggs.webp",
    name: "Stefon Diggs",
    position: "Wide Receiver",
    projectedTotal: 175,
    pctChange: 6.3,
  },
];

export default function Home() {
  return (
    <div className="w-full h-full py-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
      {playerData.map((player) => (
        <PlayerCard key={player.name} playerData={player} />
      ))}
    </div>
  );
}
