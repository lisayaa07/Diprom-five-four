import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Sarabun",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/gh/google/fonts@master/ofl/sarabun/Sarabun-Regular.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdn.jsdelivr.net/gh/google/fonts@master/ofl/sarabun/Sarabun-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});
const styles = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 12,
    padding: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    border: "1px solid #000",
  },
  rownbroder: {
    flexDirection: "row",
  },

  column: {
    flex: 1,
  },

  leftColumn: {
    flex: 1,

    borderRight: "1px solid #000", // เส้นคั่นตรงกลาง
  },
  

  text: {
    marginBottom: 5,
    paddingLeft: 10,
    paddingTop: 5,
  },
  textBold: {
    marginBottom: 5,
    paddingLeft: 10,
    fontWeight: "bold",
  },
  fullUnderline: {
    flex: 1,
    borderBottom: 1,
    borderColor: "#000",
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    paddingLeft: 10,
    paddingTop: 2, // ปรับค่าน้อยๆ เพื่อให้ชิดเส้นด้านบน
    marginBottom: 2,
  },
});

type Props = {
  email: string;
  companyName: string;
  orderDate: string;
  dueDate: string;
  jobName: string;

  customername?: string;
  address?: string;
  phone?: string;
  line?: string;
  workTypeFromNotes?: string;
  quantity?: string | number;
  cover?: string;
  inside?: string;
  billTypes?: string;
  paperColor?: string;
  laxineColor?: string;
  wire?: string;
  Adsan?: string;
  glue?: string;
  folding?: string;
  details?: string;
  pos?: string;
  color?: string;
  book?: string;
  rangeText?: string;
  detail?: string;
  count_Detail?: string | number;
  detail_Type?: string;
  typeOfWorkText?: string;
  printer?: string;
};

const MyPdfDocument = ({
  email,
  companyName,
  orderDate,
  dueDate,
  jobName,

  customername,
  address,
  phone,
  line,
  workTypeFromNotes,
  quantity,
  cover,
  inside,
  billTypes,
  paperColor, 
  laxineColor,
  wire,
  Adsan,
  glue,
  folding,
  details,
  pos,
  color,
  book,
  rangeText,
  detail,
  count_Detail,
  detail_Type,
  typeOfWorkText,
  printer,



}: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>ใบสั่งพิมพ์งาน</Text>
      <View style={styles.row}>

        //ตารางซ้าย
        <View style={[styles.leftColumn, { flex: 1 }]}>
          <Text style={styles.text}>ชื่อบริษัท: {companyName}</Text>
          <Text style={styles.text}>ชื่อลูกค้า: {customername || "-"}</Text>
          <Text style={styles.text}>ที่อยู่: {address || "-"}</Text>
          <Text style={styles.text}>เบอร์โทร: {phone || "-"}</Text>
          <Text style={styles.text}>อีเมล: {email}</Text>
          <Text style={styles.text}>ไลน์: {line || "-"}</Text>

          <View
            style={{
              borderBottom: "1px solid #000",
              width: "100%",
              marginVertical: 6,
            }}
          />

          <Text style={styles.text}>ประเภทงาน: {workTypeFromNotes || "-"}</Text>

          <View
            style={{
              borderBottom: "1px solid #000",
              width: "100%",
              marginVertical: 6,
            }}
          />
          <Text style={styles.text}>จำนวนสั่ง: {quantity || "-"} หน่วย</Text>

           <View
            style={{
              borderBottom: "1px solid #000",
              width: "100%",
              marginVertical: 6,
            }}
          />
          <Text style={styles.detailsTitle}>กระดาษที่ใช้</Text>
          <Text style={styles.text}>หนังสือ ปก : {cover || "-"}</Text>
          <Text style={[styles.text, { marginLeft: 36 }]}>เนื้อใน : {inside || "-"}</Text>
          <Text style={[styles.text, { marginLeft: 36 }]}>งานบิล : {billTypes || "-"}</Text>
            <View
            style={{
              borderBottom: "1px solid #000",
              width: "100%",
              marginVertical: 6,
            }}
          />
          <Text style={styles.detailsTitle}>ปะสันสี</Text>
          <Text style={styles.text}>กระดาษ : {paperColor || "-"}</Text>
          <Text style={styles.text}>แล็กซีน : {laxineColor || "-"}</Text>
          
            <View
            style={{
              borderBottom: "1px solid #000",
              width: "100%",
              marginVertical: 6,
            }}
          />
           <Text style={styles.detailsTitle}>การเข้าเล่ม, ตีปรุและรันนัมเบอร์</Text>
           <Text style={styles.text}>เย็บลวด : {wire || "-"}</Text>
           <Text style={styles.text}>อัดสัน : {Adsan || "-"}</Text>
            {glue && <Text style={styles.text}>ไสกาว</Text>}
            <Text style={styles.text}>พับ : {folding || "-"}</Text>
            <Text style={styles.text}>อื่นๆ : {details || "-"}</Text>
            <Text style={styles.text}>ปรุ : {pos || "-"}</Text>
            <Text style={styles.text}>รันนัมเบอร์ สี : {color || "-"}</Text>
            <Text style={styles.text}>เล่มที่ : {book || "-"}</Text>
            <Text style={styles.text}>เลขที่ : {rangeText || "-"}</Text>
            
        </View>

        //ตารางขวา 
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              borderBottom: "1px solid #000",
              minHeight: 25,
            }}
          >
            <View
              style={[styles.leftColumn, { borderRight: "1px solid #000" }]}
            >
              <Text style={styles.text}>วันรับงาน: {orderDate}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>วันส่งงาน: {dueDate}</Text>
            </View>
          </View>

          <View style={{ borderBottom: "1px solid #000", minHeight: 25 }}>
            <Text style={styles.text}>ชื่องาน: {jobName}</Text>
          </View>

          <View>
            <Text style={styles.detailsTitle}>รายละเอียดงาน</Text>
            <Text style={styles.text}>ขนาดสำเร็จ: {detail || "-"}</Text>
            <Text style={styles.text}>จำนวนพิมพ์: {count_Detail || "-"}</Text>
            <Text style={styles.text}>รูปแบบ: {detail_Type || "-"}</Text>
             <View
            style={{
              borderBottom: "1px solid #000",
              width: "100%",
              marginVertical: 6,
            }}
          />
          <Text style={styles.detailsTitle}>ชนิดรูปแบบงาน</Text>
          <Text style={styles.text}>{typeOfWorkText || "-"}</Text>
          <View
            style={{
              borderBottom: "1px solid #000",
              width: "100%",
              marginVertical: 6,
            }}
          />

          <Text style={styles.detailsTitle}>เครื่องพิมพ์พิมพ์</Text>
          <Text style={styles.text}>{printer || "-"}</Text>
            
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export default MyPdfDocument;
