package handlers

import (
	"testing"

	"qazgost-ai/backend/pkg/models"
)

// Инженер без CRM: всё, что может инженер, кроме чужих сделок CRM.
func TestEngineerNoCRMRole(t *testing.T) {
	if crmSeesAll(RoleEngineerNoCRM) {
		t.Fatal("инженер без CRM видит все сделки CRM")
	}
	if !crmSeesAll("engineer") {
		t.Fatal("обычный инженер перестал видеть сделки CRM")
	}
	v := crmViewer{uid: "u_saken", role: RoleEngineerNoCRM}
	if v.canSee(&models.CRMEvent{ID: "deal_1", CreatedBy: "u_manager", Phone: "+77010000000"}) {
		t.Fatal("инженер без CRM видит чужую сделку")
	}
	if !isEngineer(RoleEngineerNoCRM) || !canSeeAllOrders(RoleEngineerNoCRM) {
		t.Fatal("инженер без CRM потерял доступ к заказам (технадзор)")
	}
	if !teamViewerRoles[RoleEngineerNoCRM] || !AdminRoles[RoleEngineerNoCRM] || !inviteRoles[RoleEngineerNoCRM] {
		t.Fatal("роль не назначается администратором или не видит команду")
	}
	if teamAccounts["saken@qazgost.kz"].Role != RoleEngineerNoCRM {
		t.Fatal("Сакен не закреплён за ролью инженера без CRM")
	}
}
