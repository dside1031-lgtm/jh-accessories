"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";


export default function DashboardChart() {


const statusData = [
  {
    name:"待付款",
    value:5
  },
  {
    name:"已付款",
    value:8
  },
  {
    name:"已出貨",
    value:4
  },
  {
    name:"已完成",
    value:12
  },
];


const productData = [
  {
    name:"保溫杯",
    sales:20
  },
  {
    name:"耳機",
    sales:15
  },
  {
    name:"櫃子",
    sales:8
  },
];


return (

<div className="
grid
md:grid-cols-2
gap-8
">


<div
className="
bg-white
rounded-xl
shadow
p-6
"
>

<h2 className="
text-xl
font-bold
mb-5
text-gray-900
">
訂單狀態分析
</h2>


<ResponsiveContainer
width="100%"
height={300}
>

<PieChart>

<Pie
data={statusData}
dataKey="value"
nameKey="name"
outerRadius={100}
label
>

{
statusData.map(
(entry,index)=>(

<Cell
key={index}
/>

))
}


</Pie>


<Tooltip />


</PieChart>


</ResponsiveContainer>


</div>





<div
className="
bg-white
rounded-xl
shadow
p-6
"
>


<h2
className="
text-xl
font-bold
mb-5
text-gray-900
"
>
熱門商品排行
</h2>


<ResponsiveContainer
width="100%"
height={300}
>


<BarChart
data={productData}
>


<XAxis
dataKey="name"
/>


<YAxis />


<Tooltip />


<Bar
dataKey="sales"
/>


</BarChart>


</ResponsiveContainer>


</div>



</div>


);


}