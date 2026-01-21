<script setup>
import { ref } from 'vue';
import titleIcon from '@/assets/images/common/title-icon.png';
import CustomerInfoCard from '@/components/customers/CustomerInfoCard.vue';
import AgencyInfoCard from '@/components/customers/AgencyInfoCard.vue';
import ProductsInfoCard from '@/components/customers/ProductsInfoCard.vue';
import ContractLogCard from '@/components/customers/ContractLogCard.vue';
import ServiceSupportTable from '@/components/customers/ServiceSupportTable.vue';
import ServicePassTable from '@/components/customers/ServicePassTable.vue';
import ServiceCommentTable from '@/components/customers/ServiceCommentTable.vue';
import VisitHistoryCard from '@/components/customers/VisitHistoryCard.vue';
import PaymentInfoCard from '@/components/customers/PaymentInfoCard.vue';
import PlusContInfoCard from '@/components/customers/PlusContInfoCard.vue';
import PcAddressInfoCard from '@/components/customers/PcAddressInfoCard.vue';
import TabletAddressInfoCard from '@/components/customers/TabletAddressInfoCard.vue';
import InstallPaymentInfoCard from '@/components/customers/InstallPaymentInfoCard.vue';
import MonthPaymentInfoCard from '@/components/customers/MonthPaymentInfoCard.vue';

// ----------------------
//  ✨reactive, ref state
// ----------------------
const activeTab = ref('support');
</script>

<template>
  <div class="d-flex flex-column gap-4">
    <CRow>
      <CCol md="7">
        <!-- 고객정보 -->
        <CustomerInfoCard />
      </CCol>
      <CCol md="5">
        <!-- 담당 대리점-->
        <AgencyInfoCard />
      </CCol>
    </CRow>
    <CRow>
      <CCol>
        <!-- 사용 제품정보-->
        <ProductsInfoCard />
      </CCol>
    </CRow>
    <CRow>
      <CCol>
        <!-- 계약내역-->
        <ContractLogCard />
      </CCol>
    </CRow>
    <CRow>
      <CCol>
        <!-- 지원내역-->
        <CCard>
          <CCardHeader>
            <h6 class="d-flex align-content-center gap-1 mb-0">
              <CImage :src="titleIcon" width="20" /> <span>지원내역</span>
            </h6>
          </CCardHeader>
          <CCardBody>
            <CTabs :active-item-key="activeTab">
              <CTabList variant="tabs">
                <CTab item-key="support">지원내역</CTab>
                <CTab item-key="pass">이관내역</CTab>
                <CTab item-key="comment">특이사항</CTab>
              </CTabList>
              <CTabContent>
                <CTabPanel class="tab-panel" item-key="support"><ServiceSupportTable /></CTabPanel>
                <CTabPanel class="tab-panel" item-key="pass"><ServicePassTable /></CTabPanel>
                <CTabPanel class="tab-panel" item-key="comment"><ServiceCommentTable /> </CTabPanel>
              </CTabContent>
            </CTabs>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
    <CRow>
      <CCol>
        <!-- 방문 내역 -->
        <VisitHistoryCard />
      </CCol>
    </CRow>
    <CRow>
      <CCol md="6">
        <!-- 결제정보 -->
        <PaymentInfoCard />
      </CCol>
      <CCol md="6">
        <!-- 추가 계약 정보 -->
        <PlusContInfoCard />
      </CCol>
    </CRow>
    <CRow>
      <CCol>
        <!-- PC 기기 정보 -->
        <PcAddressInfoCard />
      </CCol>
    </CRow>
    <CRow>
      <CCol>
        <!-- Tablet 기기 정보 -->
        <TabletAddressInfoCard />
      </CCol>
    </CRow>
    <CRow>
      <CCol>
        <!-- 설치비 수납정보 -->
        <InstallPaymentInfoCard />
      </CCol>
    </CRow>
    <CRow>
      <CCol>
        <!-- 월회비 수납정보 -->
        <MonthPaymentInfoCard />
      </CCol>
    </CRow>
  </div>
</template>

<style scoped>
.tab-panel {
  padding-top: 20px;
}
</style>
