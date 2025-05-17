package com.example.BackEndSpring.controller;

import com.example.BackEndSpring.model.Setting;
import com.example.BackEndSpring.service.SettingService;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMethod;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true", 
    allowedHeaders = {"authorization", "content-type", "x-auth-token", "origin", "x-requested-with", "accept"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/api/settings")
public class SettingController {

    private final SettingService settingService;

    @Autowired
    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping
    public ResponseEntity<List<Setting>> getAllSettings() {
        List<Setting> settings = settingService.getAllSettings();
        return ResponseEntity.ok(settings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Setting> getSettingById(@PathVariable Long id) {
        return settingService.getSettingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/key/{key}")
    public ResponseEntity<Setting> getSettingByKey(@PathVariable String key) {
        return settingService.getSettingByKey(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/group/{groupName}")
    public ResponseEntity<List<Setting>> getSettingsByGroup(@PathVariable String groupName) {
        List<Setting> settings = settingService.getSettingsByGroup(groupName);
        return ResponseEntity.ok(settings);
    }

    @PostMapping
    public ResponseEntity<?> createSetting(@RequestBody Setting setting) {
        try {
            Setting createdSetting = settingService.createSetting(setting);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdSetting);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSetting(@PathVariable Long id, @RequestBody Setting settingDetails) {
        try {
            Setting updatedSetting = settingService.updateSetting(id, settingDetails);
            return ResponseEntity.ok(updatedSetting);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/key/{key}")
    public ResponseEntity<?> updateSettingByKey(@PathVariable String key, @RequestBody Map<String, String> payload) {
        try {
            String value = payload.get("value");
            if (value == null) {
                return ResponseEntity.badRequest().body("Value is required");
            }
            
            Setting updatedSetting = settingService.updateSetting(key, value);
            return ResponseEntity.ok(updatedSetting);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSetting(@PathVariable Long id) {
        if (settingService.getSettingById(id).isPresent()) {
            settingService.deleteSetting(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}