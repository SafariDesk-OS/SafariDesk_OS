from django.urls import path

from tenant.views.AgentView import AgentView

urlpatterns = [
    path('create/', AgentView.as_view({'post': 'create'}), name='agent_create'),
    path('list/', AgentView.as_view({'get': 'list'}), name='agent_list'),
    path('update/<int:id>', AgentView.as_view({'put': 'update'}), name='agent_update'),
    path('status/<int:id>', AgentView.as_view({'put': 'deactivate_activate_agent'}), name='deactivate_activate_agent'),
    path('get/<int:id>', AgentView.as_view({'get': 'retrieve'}), name='agent_retrieve'),
]





