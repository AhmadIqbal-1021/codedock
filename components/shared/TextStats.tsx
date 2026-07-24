import { getTextStats } from "@/lib/text-stats";


type Props = {
  text: string;
};


export default function TextStats({
  text,
}: Props) {


  const stats =
    getTextStats(text);


  return (

    <div className="flex gap-4 text-sm text-muted-foreground">

      <span>
        Characters: {stats.characters}
      </span>


      <span>
        Lines: {stats.lines}
      </span>


      <span>
        Bytes: {stats.bytes}
      </span>


    </div>

  );
}