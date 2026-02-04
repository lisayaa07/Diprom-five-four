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
}: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>ใบสั่งพิมพ์งาน</Text>
      <View style={styles.row}>

        //ตารางซ้าย
        <View style={[styles.leftColumn, { flex: 1 }]}>
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
          <Text style={styles.text}>ปะสันสี : {paperColor || "-"}</Text>
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
            <Text style={styles.text}>ขนาดสำเร็จ:</Text>
            <Text style={styles.text}>ชื่อบริษัท: {companyName}</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export default MyPdfDocument;
