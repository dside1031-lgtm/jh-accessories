"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";


export default function SalesChart({
  orders,
}:{
  orders:any[];
}) {


  const data =
    orders.map((order)=>({

      date:
      new Date(order.createdAt)
      .toLocaleDateString("zh-TW"),


      revenue:
      order.total,


    }));



  return (

    <div
      className="
      bg-white
      shadow
      rounded-xl
      p-6
      border
      "
    >


      <h2
        className="
        text-2xl
        font-bold
        text-black
        mb-6
        "
      >
        📈 營收趨勢
      </h2>



      <div
        className="
        h-80
        "
      >


        <ResponsiveContainer
          width="100%"
          height="100%"
        >


          <LineChart
            data={data}
          >


            <CartesianGrid
              strokeDasharray="3 3"
            />


            <XAxis
              dataKey="date"
            />


            <YAxis />


            <Tooltip />


            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#000000"
              strokeWidth={3}
            />


          </LineChart>


        </ResponsiveContainer>


      </div>


    </div>

  );

}